import React from 'react';
import { Unsubscribable } from 'rxjs';
import { rangeUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { RefreshPicker } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObject, SceneObjectState, SceneObjectUrlValues } from '../core/types';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';
import { REFRESH_INTERACTION } from '../performance/interactionConstants';
import { t } from '@grafana/i18n';

export const DEFAULT_INTERVALS = ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d'];

export interface SceneRefreshPickerState extends SceneObjectState {
  /**
   * Refresh interval, e.g. 5s, 1m, 2h
   */
  refresh: string;
  autoEnabled?: boolean;
  autoMinInterval?: string;
  autoValue?: string;
  /**
   * List of allowed refresh intervals, e.g. ['5s', '1m']
   */
  intervals?: string[];
  isOnCanvas?: boolean;
  primary?: boolean;
  withText?: boolean;
  /**
   * Overrides the default minRefreshInterval from the grafana config. Can be set to "0s" to remove the minimum refresh interval.
   */
  minRefreshInterval?: string;
}

export class SceneRefreshPicker extends SceneObjectBase<SceneRefreshPickerState> {
  public static Component = SceneRefreshPickerRenderer;
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['refresh'] });
  private _intervalTimer: ReturnType<typeof setInterval> | undefined;
  private _autoTimeRangeListener: Unsubscribable | undefined;
  private _autoRefreshBlocked = false;

  public constructor(state: Partial<SceneRefreshPickerState>) {
    const filterDissalowedIntervals = (i: string) => {
      const minInterval = state.minRefreshInterval ?? config.minRefreshInterval;
      try {
        return minInterval ? rangeUtil.intervalToMs(i) >= rangeUtil.intervalToMs(minInterval) : true;
      } catch (e) {
        // Unable to parse interval
        return false;
      }
    };

    super({
      refresh: '',
      ...state,
      autoValue: undefined,
      autoEnabled: state.autoEnabled ?? true,
      autoMinInterval: state.autoMinInterval ?? config.minRefreshInterval,
      intervals: (state.intervals ?? DEFAULT_INTERVALS).filter(filterDissalowedIntervals),
    });

    this.addActivationHandler(() => {
      this.setupIntervalTimer();

      const onVisibilityChange = () => {
        if (this._autoRefreshBlocked && document.visibilityState === 'visible') {
          this._autoRefreshBlocked = false;
          this.onRefresh();
        }
      };

      document.addEventListener('visibilitychange', onVisibilityChange);

      return () => {
        if (this._intervalTimer) {
          clearInterval(this._intervalTimer);
        }

        document.removeEventListener('visibilitychange', onVisibilityChange);
        this._autoTimeRangeListener?.unsubscribe();
      };
    });
  }

  public onRefresh = () => {
    const queryController = sceneGraph.getQueryController(this);

    if (queryController?.state.isRunning) {
      queryController.cancelAll();
      queryController.cancelProfile();
      return;
    }

    queryController?.startProfile(REFRESH_INTERACTION);

    const timeRange = sceneGraph.getTimeRange(this);

    if (this._intervalTimer) {
      clearInterval(this._intervalTimer);
    }

    timeRange.onRefresh();
    this.setupIntervalTimer();
  };

  public onIntervalChanged = (interval: string) => {
    this.setState({ refresh: interval });
    this.setupIntervalTimer();
  };

  public getUrlState() {
    let refresh: string | undefined = this.state.refresh;

    if (typeof refresh !== 'string' || refresh.length === 0) {
      refresh = undefined;
    }

    return { refresh };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    const { intervals } = this.state;
    let refresh = values.refresh;

    if (typeof refresh === 'string' && isIntervalString(refresh)) {
      if (intervals?.includes(refresh)) {
        this.setState({ refresh });
      } else {
        this.setState({
          // Default to the closest refresh interval if the interval from the URL is not allowed.
          refresh: intervals ? findClosestInterval(refresh, intervals) : undefined,
        });
      }
    }
  }

  private setupAutoTimeRangeListener = () => {
    // If the time range has changed, we need to recalculate the auto interval but prevent unnecessary processing
    return sceneGraph.getTimeRange(this).subscribeToState((newState, prevState) => {
      if (newState.from !== prevState.from || newState.to !== prevState.to) {
        this.setupIntervalTimer();
      }
    });
  };

  private calculateAutoRefreshInterval = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    const resolution = window?.innerWidth ?? 2000;
    return rangeUtil.calculateInterval(timeRange.state.value, resolution, this.state.autoMinInterval);
  };

  private isTabVisible() {
    return document.visibilityState === undefined || document.visibilityState === 'visible';
  }

  private setupIntervalTimer = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    const { refresh, intervals } = this.state;

    if (this._intervalTimer || refresh === '') {
      clearInterval(this._intervalTimer);
    }

    if (refresh === '') {
      return;
    }

    // If the provided interval is not allowed
    if (refresh !== RefreshPicker.autoOption.value && intervals && !intervals.includes(refresh)) {
      return;
    }

    let intervalMs: number;

    // Unsubscribe from previous listener no matter what
    this._autoTimeRangeListener?.unsubscribe();

    if (refresh === RefreshPicker.autoOption.value) {
      const autoRefreshInterval = this.calculateAutoRefreshInterval();

      intervalMs = autoRefreshInterval.intervalMs;

      this._autoTimeRangeListener = this.setupAutoTimeRangeListener();

      if (autoRefreshInterval.interval !== this.state.autoValue) {
        this.setState({ autoValue: autoRefreshInterval.interval });
      }
    } else {
      intervalMs = rangeUtil.intervalToMs(refresh);
    }

    this._intervalTimer = setInterval(() => {
      if (this.isTabVisible()) {
        const queryController = sceneGraph.getQueryController(this);

        if (queryController?.state.isRunning) {
          queryController.cancelProfile();
        }

        queryController?.startProfile(REFRESH_INTERACTION);
        timeRange.onRefresh();
      } else {
        this._autoRefreshBlocked = true;
      }
    }, intervalMs);
  };
}

export function SceneRefreshPickerRenderer({ model }: SceneComponentProps<SceneRefreshPicker>) {
  const { refresh, intervals, autoEnabled, autoValue, isOnCanvas, primary, withText } = model.useState();
  const isRunning = useQueryControllerState(model);

  let text =
    refresh === RefreshPicker.autoOption?.value
      ? autoValue
      : withText
      ? t('grafana-scenes.components.scene-refresh-picker.text-refresh', 'Refresh')
      : undefined;
  let tooltip: string | undefined;
  let width: string | undefined;

  if (isRunning) {
    tooltip = t('grafana-scenes.components.scene-refresh-picker.tooltip-cancel', 'Cancel all queries');

    if (withText) {
      text = t('grafana-scenes.components.scene-refresh-picker.text-cancel', 'Cancel');
    }
  }

  if (withText) {
    width = '96px';
  }

  return (
    <RefreshPicker
      showAutoInterval={autoEnabled}
      value={refresh}
      intervals={intervals}
      tooltip={tooltip}
      width={width}
      text={text}
      onRefresh={() => {
        model.onRefresh();
      }}
      primary={primary}
      onIntervalChanged={model.onIntervalChanged}
      isLoading={isRunning}
      isOnCanvas={isOnCanvas ?? true}
    />
  );
}

function useQueryControllerState(model: SceneObject): boolean {
  const queryController = sceneGraph.getQueryController(model);
  if (!queryController) {
    return false;
  }

  return queryController.useState().isRunning;
}

function isIntervalString(str: string): boolean {
  try {
    const res = rangeUtil.describeInterval(str);
    return res.count > 0;
  } catch {
    return false;
  }
}

function findClosestInterval(userInterval: string, allowedIntervals: string[]): string | undefined {
  if (allowedIntervals.length === 0) {
    return undefined;
  }

  const userIntervalMs = rangeUtil.intervalToMs(userInterval);
  let selectedInterval = allowedIntervals[0];

  for (let i = 1; i < allowedIntervals.length; i++) {
    const intervalMs = rangeUtil.intervalToMs(allowedIntervals[i]);

    if (intervalMs > userIntervalMs) {
      break;
    }
    
    selectedInterval = allowedIntervals[i];
  }
  return selectedInterval;
}
