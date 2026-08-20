import { Observable, of, filter, take, mergeMap, catchError, throwError, from, lastValueFrom, forkJoin } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import {
  CoreApp,
  DataQueryRequest,
  LoadingState,
  MetricFindValue,
  PanelData,
  ScopedVars,
  VariableRefresh,
  VariableSort,
  VariableRegexApplyTo,
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
import { expandMultiValueDatasourceUids } from '../../datasourceVariableRef';
import React from 'react';

export interface QueryVariableState extends MultiValueVariableState {
  type: 'query';
  datasource: DataSourceRef | null;
  query: string | SceneDataQuery;
  regex: string;
  regexApplyTo: VariableRegexApplyTo;
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
    statePaths: ['regex', 'regexApplyTo', 'query', 'datasource'],
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
      regexApplyTo: 'value',
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

    const fanOutUids = expandMultiValueDatasourceUids(this, this.state.datasource);
    const datasourceRefs: Array<DataSourceRef | null> = fanOutUids
      ? fanOutUids.map((uid) => ({ ...this.state.datasource, uid }))
      : [this.state.datasource];

    const scopedSceneObject = {
      __sceneObject: wrapInSafeSerializableSceneObject(this),
    };

    const perDatasource = datasourceRefs.map((datasource) =>
      from(getDataSource(datasource, scopedSceneObject)).pipe(
        mergeMap((ds) => this.runMetricFindForDatasource(ds, args)),
        catchError((error) => {
          if (error?.cancelled) {
            return of({ values: [] as MetricFindValue[], error: undefined });
          }
          return of({ values: [] as MetricFindValue[], error });
        })
      )
    );

    return forkJoin(perDatasource).pipe(
      mergeMap((results) => {
        const values = results.flatMap((result) => result.values);
        const errors = results.map((result) => result.error).filter(Boolean);

        if (values.length === 0 && errors.length > 0) {
          return throwError(() => errors[0]);
        }

        return of(this.metricFindValuesToOptions(values));
      })
    );
  }

  private runMetricFindForDatasource(
    ds: Awaited<ReturnType<typeof getDataSource>>,
    args: VariableGetOptionsArgs
  ): Observable<{ values: MetricFindValue[]; error?: unknown }> {
    const runner = createQueryVariableRunner(ds);
    const target = runner.getTarget(this);
    const request = this.getRequest(target, args.searchFilter);

    return runner.runRequest({ variable: this, searchFilter: args.searchFilter }, request).pipe(
      registerQueryWithController({
        type: 'QueryVariable/getValueOptions',
        request: request,
        origin: this,
      }),
      filter((data) => data.state === LoadingState.Done || data.state === LoadingState.Error),
      take(1),
      mergeMap((data: PanelData) => {
        if (data.state === LoadingState.Error) {
          return throwError(() => data.error);
        }
        return of(data);
      }),
      toMetricFindValues(),
      mergeMap((values) => of({ values, error: undefined as unknown }))
    );
  }

  private metricFindValuesToOptions(values: MetricFindValue[]): VariableValueOption[] {
    let regex = '';
    if (this.state.regex) {
      regex = sceneGraph.interpolate(this, this.state.regex, undefined, 'regex');
    }
    let options = metricNamesToVariableValues({
      variableRegEx: regex,
      variableRegexApplyTo: this.state.regexApplyTo,
      sort: this.state.sort,
      metricNames: values,
    });
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
    return options;
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
