import { rangeUtil, SelectableValue } from '@grafana/data';
import { VariableRefresh } from '@grafana/schema';
import { Select } from '@grafana/ui';
import React from 'react';
import { Observable, of } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps } from '../../core/types';
import {
  SceneVariable,
  SceneVariableState,
  SceneVariableValueChangedEvent,
  ValidateAndUpdateResult,
  VariableValue,
  VariableValueOption,
} from '../types';

export interface IntervalVariableState extends SceneVariableState {
  intervals: string[];
  value: string;
  options: VariableValueOption[];
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
      options: [],
      intervals: ['1m', '10m', '30m', '1h', '6h', '12h', '1d', '7d', '14d', '30d'],
      name: '',
      autoStepCount: 30,
      autoMinInterval: '10s',
      autoEnabled: false,
      refresh: VariableRefresh.onTimeRangeChanged,
      ...initialState,
    });
  }

  public getOptionsForSelect(): Array<SelectableValue<string>> {
    const options = this.state.intervals.map((interval) => {
      return { value: interval, label: interval };
    });

    if (this.state.autoEnabled) {
      // add autoEnabled option if missing
      if (options.length && options[0].value !== '$auto') {
        options.unshift({ value: '$auto', label: 'Auto' });
      }
    }

    return options;
  }

  public getValue(): VariableValue {
    if (this.state.value === '$auto') {
      return this.getAutoRefreshInteval(this.state.autoStepCount, this.state.autoMinInterval);
    }

    return this.state.value;
  }

  private getAutoRefreshInteval(autoStepCount: number, minRefreshInterval: string) {
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const intervalObject = rangeUtil.calculateInterval(timeRange, autoStepCount, minRefreshInterval);

    console.log('interval updated from getAutoRefreshInterval', intervalObject);

    return intervalObject.interval;
  }

  public _onChange = (value: SelectableValue<string>) => {
    this.setState({ value: value.value!, label: value.label! });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  };

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    const { value } = this.state;
    // If auto the value can change (can optimize this bit later and only publish this when the calculated value actually changed)
    if (value === '$auto') {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    } else if (!this.state.value) {
      // Todo set to first option in this.state.intervals
      const firstOption = this.state.intervals[0];
      this.setState({ value: firstOption });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
    return of({});
  }

  public static Component = ({ model }: SceneComponentProps<IntervalVariable>) => {
    const { key, value } = model.useState();
    // should we use the renderSelectForVariable here? or just the select?
    return (
      <Select<string, { onCancel: () => void }>
        id={key}
        placeholder="Select value"
        width="auto"
        value={value}
        tabSelectsValue={false}
        options={model.getOptionsForSelect()}
        onChange={model._onChange}
        onCancel={() => {
          // do we need to impelement this?
        }}
      />
    );
  };
}
