import { rangeUtil, SelectableValue } from '@grafana/data';
import { VariableRefresh } from '@grafana/schema';
import { Select } from '@grafana/ui';
import React from 'react';
import { Observable, of } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectUrlValues } from '../../core/types';
import { SceneObjectUrlSyncConfig } from '../../services/SceneObjectUrlSyncConfig';
import { AUTO_VARIABLE_TEXT, AUTO_VARIABLE_VALUE } from '../constants';
import {
  SceneVariable,
  SceneVariableState,
  SceneVariableValueChangedEvent,
  ValidateAndUpdateResult,
  VariableValue,
} from '../types';

export interface IntervalVariableState extends SceneVariableState {
  intervals: string[];
  value: string;
  autoEnabled: boolean;
  autoMinInterval: string;
  autoStepCount: number;
  refresh: VariableRefresh;
}

export class IntervalVariable
  extends SceneObjectBase<IntervalVariableState>
  implements SceneVariable<IntervalVariableState>
{
  public constructor(initialState: Partial<IntervalVariableState>) {
    super({
      type: 'interval',
      value: '',
      intervals: ['1m', '10m', '30m', '1h', '6h', '12h', '1d', '7d', '14d', '30d'],
      name: '',
      autoStepCount: 30,
      autoMinInterval: '10s',
      autoEnabled: false,
      refresh: VariableRefresh.onTimeRangeChanged,
      ...initialState,
    });

    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: [this.getKey()] });
  }

  private getKey(): string {
    return `var-${this.state.name}`;
  }

  public getUrlState() {
    return { [this.getKey()]: this.state.value };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    const update: Partial<IntervalVariableState> = {};
    const val = values[this.getKey()];
    if (typeof val === 'string') {
      update.value = val;
    }

    // What happen if the value is not in the list of intervals?
    this.setState(update);
  }

  public getOptionsForSelect(): Array<SelectableValue<string>> {
    const options = this.state.intervals.map((interval) => {
      return { value: interval, label: interval };
    });

    if (this.state.autoEnabled) {
      // add autoEnabled option if missing
      if (options.length && options[0].value !== '$auto') {
        options.unshift({ value: AUTO_VARIABLE_VALUE, label: AUTO_VARIABLE_TEXT });
      }
    }

    return options;
  }

  public getValue(): VariableValue {
    if (this.state.value === AUTO_VARIABLE_VALUE) {
      return this.getAutoRefreshInteval(this.state.autoStepCount, this.state.autoMinInterval);
    }

    return this.state.value;
  }

  private getAutoRefreshInteval(autoStepCount: number, minRefreshInterval: string) {
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const intervalObject = rangeUtil.calculateInterval(timeRange, autoStepCount, minRefreshInterval);
    return intervalObject.interval;
  }

  public _onChange = (value: SelectableValue<string>) => {
    this.setState({ value: value.value! });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  };

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    const { value } = this.state;
    // If 'Auto' the value can change (can optimize this bit later and only publish this when the calculated value actually changed)
    if (value === AUTO_VARIABLE_VALUE) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    } else if (!this.state.value) {
      const firstOption = this.state.intervals[0];
      this.setState({ value: firstOption });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
    return of({});
  }

  public static Component = ({ model }: SceneComponentProps<IntervalVariable>) => {
    const { key, value } = model.useState();
    return (
      <Select
        id={key}
        placeholder="Select value"
        width="auto"
        value={value}
        tabSelectsValue={false}
        options={model.getOptionsForSelect()}
        onChange={model._onChange}
      />
    );
  };
}
