import React from 'react';
import { Unsubscribable } from 'rxjs';
import { rangeUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { RefreshPicker } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObject, SceneObjectState, SceneObjectUrlValues } from '../core/types';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

export const DEFAULT_INTERVALS = ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d'];

export interface SceneRefreshPickerState extends SceneObjectState {
  // Refresh interval, e.g. 5s, 1m, 2h
  refresh: string;
  autoEnabled?: boolean;
  autoMinInterval?: string;
  // List of allowed refresh intervals, e.g. ['5s', '1m']
  intervals?: string[];
  isOnCanvas?: boolean;
  primary?: boolean;
  withText?: boolean;
}

export class SceneRefreshPicker extends SceneObjectBase<SceneRefreshPickerState> {
  public static Component = SceneRefreshPickerRenderer;
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['refresh'] });
  private _intervalTimer: ReturnType<typeof setInterval> | undefined;
  private _timeRangeListener: Unsubscribable | undefined;

  public constructor(state: Partial<SceneRefreshPickerState>) {
    super({
      refresh: '',
      ...state,
      autoEnabled: state.autoEnabled ?? true,
      autoMinInterval: state.autoMinInterval ?? config.minRefreshInterval,
      intervals: state.intervals ?? DEFAULT_INTERVALS,
    });

    this.addActivationHandler(() => {
      this.setupIntervalTimer();

      return () => {
        if (this._intervalTimer) {
          clearInterval(this._intervalTimer);
        }

        this._timeRangeListener?.unsubscribe();
      };
    });
  }

  public onRefresh = () => {
    const queryController = sceneGraph.getQueryController(this);
    if (queryController?.state.isRunning) {
      queryController.cancelAll();
      return;
    }

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
    return {
      refresh: this.state.refresh,
    };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    const refresh = values.refresh;

    if (refresh && typeof refresh === 'string') {
      this.setState({
        refresh,
      });
    }
  }

  private setupTimeRangeListener = () => {
    // If the time range has changed, we need to recalculate the auto interval
    // But we need to prevent unnecessary recalculations
    // So we just check if what actually matters to the algorithm is indeed changed
    // Alternatively we could just check if from, to, timeZone, fiscal year start month and now delay are changed
    return sceneGraph.getTimeRange(this).subscribeToState((newState, prevState) => {
      const newDiff = newState.value.to.valueOf() - newState.value.from.valueOf();
      const prevDiff = prevState.value.to.valueOf() - prevState.value.from.valueOf();

      if (newDiff !== prevDiff) {
        this.setupIntervalTimer();
      }
    });
  };

  private calculateAutoRefreshInterval = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    const resolution = window?.innerWidth ?? 2000;
    const { intervalMs } = rangeUtil.calculateInterval(timeRange.state.value, resolution, this.state.autoMinInterval);
    return intervalMs;
  };

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

    if (refresh === RefreshPicker.autoOption.value) {
      intervalMs = this.calculateAutoRefreshInterval();
      this._timeRangeListener = this.setupTimeRangeListener();
    } else {
      intervalMs = rangeUtil.intervalToMs(refresh);
      this._timeRangeListener?.unsubscribe();
      this._timeRangeListener = undefined;
    }

    this._intervalTimer = setInterval(() => {
      timeRange.onRefresh();
    }, intervalMs);
  };
}

export function SceneRefreshPickerRenderer({ model }: SceneComponentProps<SceneRefreshPicker>) {
  const { refresh, intervals, autoEnabled, isOnCanvas, primary, withText } = model.useState();
  const isRunning = useQueryControllerState(model);

  let text = withText ? 'Refresh' : undefined;
  let tooltip: string | undefined;

  if (isRunning) {
    tooltip = 'Cancel all queries';

    if (withText) {
      text = 'Cancel';
    }
  }

  return (
    <RefreshPicker
      showAutoInterval={autoEnabled}
      value={refresh}
      intervals={intervals}
      tooltip={tooltip}
      text={text}
      onRefresh={model.onRefresh}
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
