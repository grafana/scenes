import React from 'react';

import { rangeUtil } from '@grafana/data';
import { RefreshPicker } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObject, SceneObjectState, SceneObjectUrlValues } from '../core/types';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

export const DEFAULT_INTERVALS = ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d'];

export interface SceneRefreshPickerState extends SceneObjectState {
  // Refresh interval, e.g. 5s, 1m, 2h
  refresh: string;
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

  public constructor(state: Partial<SceneRefreshPickerState>) {
    super({
      refresh: '',
      ...state,
      intervals: state.intervals ?? DEFAULT_INTERVALS,
    });

    this.addActivationHandler(() => {
      this.setupIntervalTimer();

      return () => {
        if (this._intervalTimer) {
          clearInterval(this._intervalTimer);
        }
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
    if (intervals && !intervals.includes(refresh)) {
      return;
    }

    const intervalMs = rangeUtil.intervalToMs(refresh);

    this._intervalTimer = setInterval(() => {
      timeRange.onRefresh();
    }, intervalMs);
  };
}

export function SceneRefreshPickerRenderer({ model }: SceneComponentProps<SceneRefreshPicker>) {
  const { refresh, intervals, isOnCanvas, primary, withText } = model.useState();
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
