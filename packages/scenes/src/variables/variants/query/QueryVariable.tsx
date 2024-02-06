import { Observable, of, filter, take, mergeMap, catchError, throwError, from, lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import {
  CoreApp,
  DataQueryRequest,
  LoadingState,
  PanelData,
  ScopedVars,
  VariableRefresh,
  VariableSort,
} from '@grafana/data';

import { sceneGraph } from '../../../core/sceneGraph';
import { SceneComponentProps } from '../../../core/types';
import { VariableDependencyConfig } from '../../VariableDependencyConfig';
import { renderSelectForVariable } from '../../components/VariableValueSelect';
import { VariableValueOption } from '../../types';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../MultiValueVariable';

import { createQueryVariableRunner } from './createQueryVariableRunner';
import { metricNamesToVariableValues } from './utils';
import { toMetricFindValues } from './toMetricFindValues';
import { getDataSource } from '../../../utils/getDataSource';
import { safeStringifyValue } from '../../utils';
import { DataQuery, DataSourceRef } from '@grafana/schema';
import { SEARCH_FILTER_VARIABLE } from '../../constants';
import { DataQueryExtended } from '../../../querying/SceneQueryRunner';
import { debounce } from 'lodash';

export interface QueryVariableState extends MultiValueVariableState {
  type: 'query';
  datasource: DataSourceRef | null;
  query: string | DataQueryExtended;
  regex: string;
  refresh: VariableRefresh;
  sort: VariableSort;
  /** @internal Only for use inside core dashboards */
  definition?: string;
}

export class QueryVariable extends MultiValueVariable<QueryVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['regex', 'query', 'datasource'],
  });

  public constructor(initialState: Partial<QueryVariableState>) {
    super({
      type: 'query',
      name: '',
      value: '',
      text: '',
      options: [],
      datasource: null,
      regex: '',
      query: { refId: 'A' },
      refresh: VariableRefresh.onDashboardLoad,
      sort: VariableSort.disabled,
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    if (!this.state.query) {
      return of([]);
    }

    this.setState({ loading: true, error: null });

    return from(
      getDataSource(this.state.datasource, {
        __sceneObject: { text: '__sceneObject', value: this },
      })
    ).pipe(
      mergeMap((ds) => {
        const runner = createQueryVariableRunner(ds);
        const target = runner.getTarget(this);
        const request = this.getRequest(target, args.searchFilter);

        return runner.runRequest({ variable: this, searchFilter: args.searchFilter }, request).pipe(
          filter((data) => data.state === LoadingState.Done || data.state === LoadingState.Error), // we only care about done or error for now
          take(1), // take the first result, using first caused a bug where it in some situations throw an uncaught error because of no results had been received yet
          mergeMap((data: PanelData) => {
            if (data.state === LoadingState.Error) {
              return throwError(() => data.error);
            }
            return of(data);
          }),
          toMetricFindValues(),
          mergeMap((values) => {
            let regex = '';
            if (this.state.regex) {
              regex = sceneGraph.interpolate(this, this.state.regex, undefined, 'regex');
            }
            return of(metricNamesToVariableValues(regex, this.state.sort, values));
          }),
          catchError((error) => {
            if (error.cancelled) {
              return of([]);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  private getRequest(target: DataQuery | string, searchFilter?: string) {
    const scopedVars: ScopedVars = {
      __sceneObject: { text: '__sceneObject', value: this },
    };

    if (searchFilter) {
      scopedVars.__searchFilter = { value: searchFilter, text: searchFilter };
    }

    const range = sceneGraph.getTimeRange(this).state.value;

    const request: DataQueryRequest = {
      app: CoreApp.Dashboard,
      requestId: uuidv4(),
      timezone: '',
      range,
      interval: '',
      intervalMs: 0,
      // @ts-ignore
      targets: [target],
      scopedVars,
      startTime: Date.now(),
    };

    return request;
  }

  onSearchChange = (searchFilter: string) => {
    if (!containsSearchFilter(this.state.query)) {
      return;
    }

    this._updateOptionsBasedOnSearchFilter(searchFilter);
  };

  private _updateOptionsBasedOnSearchFilter = debounce(async (searchFilter: string) => {
    const result = await lastValueFrom(this.getValueOptions({ searchFilter }));
    this.setState({ options: result, loading: false });
  }, 400);

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return renderSelectForVariable(model);
  };
}

function containsSearchFilter(query: string | DataQuery) {
  const str = safeStringifyValue(query);
  return str.indexOf(SEARCH_FILTER_VARIABLE) > -1;
}
