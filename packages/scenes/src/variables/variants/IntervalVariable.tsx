import { t } from '@grafana/i18n';
import { rangeUtil, SelectableValue } from '@grafana/data';
import { VariableRefresh } from '@grafana/schema';
import { Select } from '@grafana/ui';
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

    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => [this.getKey()] });
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
      // support old auto interval url value
      if (val.startsWith('$__auto_interval_')) {
        update.value = AUTO_VARIABLE_VALUE;
      } else {
        update.value = val;
      }
    }
    this.setState(update);
  }

  public getOptionsForSelect(): Array<SelectableValue<string>> {
    const { value: currentValue, intervals, autoEnabled } = this.state;

    let options = intervals.map((interval) => ({ value: interval, label: interval }));

    if (autoEnabled) {
      options = [{ value: AUTO_VARIABLE_VALUE, label: AUTO_VARIABLE_TEXT }, ...options];
    }

    // If the current value is not in the list of intervals, add it to the list
    if (currentValue && !options.some((option) => option.value === currentValue)) {
      options.push({ value: currentValue, label: currentValue });
    }

    return options;
  }

  public getValue(): VariableValue {
    const { value, autoStepCount, autoMinInterval } = this.state;
    if (value === AUTO_VARIABLE_VALUE) {
      return this.getAutoRefreshInteval(autoStepCount, autoMinInterval);
    }

    return value;
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
    const { value, intervals } = this.state;
    let shouldPublish = false;

    if (value === AUTO_VARIABLE_VALUE) {
      shouldPublish = true;
    } else if (!value && intervals.length > 0) {
      const firstOption = intervals[0];
      this.setState({ value: firstOption });
      shouldPublish = true;
    }

    if (shouldPublish) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }

    return of({});
  }

  public static Component = ({ model }: SceneComponentProps<IntervalVariable>) => {
    const { key, value } = model.useState();
    return (
      <Select
        id={key}
        placeholder={t('grafana-scenes.variables.interval-variable.placeholder-select-value', 'Select value')}
        width="auto"
        value={value}
        tabSelectsValue={false}
        options={model.getOptionsForSelect()}
        onChange={model._onChange}
      />
    );
  };
}
