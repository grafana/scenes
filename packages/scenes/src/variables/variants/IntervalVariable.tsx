import { rangeUtil } from '@grafana/data';
import { VariableRefresh } from '@grafana/schema';
import { Observable, of } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';
import { renderSelectForVariable } from '../components/VariableValueSelect';
import { SceneVariableValueChangedEvent, VariableValue, VariableValueOption } from '../types';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';

export interface IntervalVariableState extends MultiValueVariableState {
  query: string;
  auto: boolean;
  auto_min: string;
  auto_count: number;
  refresh: VariableRefresh;
}

export class IntervalVariable extends MultiValueVariable<IntervalVariableState> {
  public constructor(initialState: Partial<IntervalVariableState>) {
    super({
      type: 'interval',
      query: '1m,10m,30m,1h,6h,12h,1d,7d,14d,30d',
      value: '',
      text: '',
      name: '',
      auto_count: 30,
      auto_min: '10s',
      options: [],
      auto: false,
      refresh: VariableRefresh.onTimeRangeChanged,
      ...initialState,
    });

    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    const timeRange = sceneGraph.getTimeRange(this);

    this._subs.add(
      timeRange.subscribeToState(() => {
        console.log('time range changed');
        // time range change should trigger a new interval calculation
        this.publishEvent(new SceneVariableValueChangedEvent(this), true);
      })
    );

    // Return deactivation handler;
    // return this._onDeactivate;
  };

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const match = this.state.query.match(/(["'])(.*?)\1|\w+/g) ?? [];
    const options = match.map((text) => {
      text = text.replace(/["']+/g, '');
      return { label: text.trim(), text: text.trim(), value: text.trim(), selected: false };
    });

    if (this.state.auto) {
      // add auto option if missing
      if (options.length && options[0].text !== 'auto') {
        options.unshift({
          label: 'auto',
          text: 'auto',
          value: '$auto',
          selected: false,
        });
      }
    }

    if (options.length === 0) {
      options.push({ label: 'No interval found', text: '', value: '', selected: false });
    }

    return of(options);
  }

  public getValue(): VariableValue {
    if (this.state.value === '$auto') {
      return this.getAutoRefreshInteval(this.state.auto_min);
    }

    return this.state.value;
  }

  private getAutoRefreshInteval(minRefreshInterval: string) {
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const resolution = window?.innerWidth ?? 2000;
    const intervalObject = rangeUtil.calculateInterval(
      timeRange,
      resolution, // the max pixels possibles
      minRefreshInterval
    );

    console.log('interval updated from getAutoRefreshInterval', intervalObject);

    return intervalObject.interval;
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return renderSelectForVariable(model);
  };
}
