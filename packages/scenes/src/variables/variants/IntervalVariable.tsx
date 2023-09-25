import { getDefaultTimeRange, rangeUtil } from '@grafana/data';
import { VariableRefresh } from '@grafana/schema';
import { config, Observable, of } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';
import { renderSelectForVariable } from '../components/VariableValueSelect';
import { VariableValueOption } from '../types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';

export interface IntervalVariableState extends MultiValueVariableState {
  query: string;
  auto: boolean;
  auto_min: string;
  auto_count: number;
  refresh: VariableRefresh;
}

export class IntervalVariable extends MultiValueVariable<IntervalVariableState> {
  // does it have dependencies?
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['query'],
  });

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
  }

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
          value: '$__auto_interval_' + this.state.name,
          selected: false,
        });
      }
    }

    if (options.length === 0) {
      options.push({ label: 'No interval found', text: '', value: '', selected: false });
    }

    return of(options);
  }

  private getAutoRefreshInteval(minRefreshInterval) {
    const timeRange = sceneGraph.getTimeRange(this).state.value || getDefaultTimeRange();
    // where is this window coming from?
    const resolution = window?.innerWidth ?? 2000;
    return rangeUtil.calculateInterval(
      timeRange,
      resolution, // the max pixels possibles
      minRefreshInterval
    );
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return renderSelectForVariable(model);
  };
}
