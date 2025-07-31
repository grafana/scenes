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
import { SceneComponentProps, SceneDataQuery } from '../../../core/types';
import { VariableDependencyConfig } from '../../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../../components/VariableValueSelect';
import { VariableValueOption } from '../../types';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../MultiValueVariable';

import { createQueryVariableRunner } from './createQueryVariableRunner';
import { metricNamesToVariableValues, sortVariableValues } from './utils';
import { toMetricFindValues } from './toMetricFindValues';
import { getDataSource } from '../../../utils/getDataSource';
import { safeStringifyValue } from '../../utils';
import { DataQuery, DataSourceRef } from '@grafana/schema';
import { SEARCH_FILTER_VARIABLE } from '../../constants';
import { debounce } from 'lodash';
import { registerQueryWithController } from '../../../querying/registerQueryWithController';
import { wrapInSafeSerializableSceneObject } from '../../../utils/wrapInSafeSerializableSceneObject';
import React from 'react';

export interface QueryVariableState extends MultiValueVariableState {
  type: 'query';
  datasource: DataSourceRef | null;
  query: string | SceneDataQuery;
  regex: string;
  refresh: VariableRefresh;
  sort: VariableSort;

  // works the same as query for custom variable, adding additional static options to ones returned by data source query
  staticOptions?: VariableValueOption[];

  // how to order static options in relation to options returned by query
  staticOptionsOrder?: 'before' | 'after' | 'sorted';
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
      query: '',
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
        __sceneObject: wrapInSafeSerializableSceneObject(this),
      })
    ).pipe(
      mergeMap((ds) => {
        const runner = createQueryVariableRunner(ds);
        const target = runner.getTarget(this);
        const request = this.getRequest(target, args.searchFilter);

        return runner.runRequest({ variable: this, searchFilter: args.searchFilter }, request).pipe(
          registerQueryWithController({
            type: 'QueryVariable/getValueOptions',
            request: request,
            origin: this,
          }),
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
            let options = metricNamesToVariableValues(regex, this.state.sort, values);
            if (this.state.staticOptions) {
              const customOptions = this.state.staticOptions;
              options = options.filter((option) => !customOptions.find((custom) => custom.value === option.value));
              if (this.state.staticOptionsOrder === 'after') {
                options.push(...customOptions);
              } else if (this.state.staticOptionsOrder === 'sorted') {
                options = sortVariableValues(options.concat(customOptions), this.state.sort);
              } else {
                options.unshift(...customOptions);
              }
            }
            return of(options);
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
      __sceneObject: wrapInSafeSerializableSceneObject(this),
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
    return <MultiOrSingleValueSelect model={model} />;
  };
}

function containsSearchFilter(query: string | DataQuery) {
  const str = safeStringifyValue(query);
  return str.indexOf(SEARCH_FILTER_VARIABLE) > -1;
}
