import React from 'react';
import { Observable, of, Unsubscribable, filter, take, mergeMap, catchError, throwError, from } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import {
  CoreApp,
  DataQuery,
  DataQueryRequest,
  DataSourceRef,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  ScopedVars,
  VariableRefresh,
  VariableSort,
} from '@grafana/data';

import { sceneGraph } from '../../../core/sceneGraph';
import { SceneComponentProps } from '../../../core/types';
import { VariableDependencyConfig } from '../../VariableDependencyConfig';
import { VariableValueSelect } from '../../components/VariableValueSelect';
import { VariableValueOption } from '../../types';
import { getDataSource } from '../../../utils/getDataSource';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../MultiValueVariable';

import { createQueryVariableRunner } from './createQueryVariableRunner';
import { metricNamesToVariableValues } from './utils';
import { toMetricFindValues } from './toMetricFindValues';

export interface QueryVariableState extends MultiValueVariableState {
  type: 'query';
  datasource: DataSourceRef | null;
  query: any;
  regex: string;
  refresh: VariableRefresh;
  sort: VariableSort;
}

export class QueryVariable extends MultiValueVariable<QueryVariableState> {
  private updateSubscription?: Unsubscribable;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['regex', 'query', 'datasource'],
  });

  public constructor(initialState: Partial<QueryVariableState>) {
    super({
      type: 'query',
      name: '',
      value: '',
      text: '',
      query: '',
      options: [],
      datasource: null,
      regex: '',
      refresh: VariableRefresh.onDashboardLoad,
      sort: VariableSort.alphabeticalAsc,
      ...initialState,
    });
  }

  public activate(): void {
    super.activate();
    const timeRange = sceneGraph.getTimeRange(this);

    if (this.state.refresh === VariableRefresh.onTimeRangeChanged) {
      this._subs.add(
        timeRange.subscribeToState({
          next: () => {
            this.updateSubscription = this.validateAndUpdate().subscribe();
          },
        })
      );
    }
  }

  public deactivate(): void {
    super.deactivate();

    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    if (this.state.query === '' || !this.state.datasource) {
      return of([]);
    }

    this.setState({ loading: true });

    return from(
      getDataSource(this.state.datasource, {
        __sceneObject: { text: '__sceneObject', value: this },
      })
    ).pipe(
      mergeMap((ds) => {
        const runner = createQueryVariableRunner(ds);
        const target = runner.getTarget(this);
        const request = this.getRequest(target);
        return runner.runRequest({ variable: this }, request).pipe(
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

  private getRequest(target: DataQuery) {
    // TODO: add support for search filter
    // const { searchFilter } = this.state.searchFilter;
    // const searchFilterScope = { searchFilter: { text: searchFilter, value: searchFilter } };
    // const searchFilterAsVars = searchFilter ? searchFilterScope : {};
    const scopedVars: ScopedVars = {
      // ...searchFilterAsVars,
      __sceneObject: { text: '__sceneObject', value: this },
    };

    const range =
      this.state.refresh === VariableRefresh.onTimeRangeChanged
        ? sceneGraph.getTimeRange(this).state.value
        : getDefaultTimeRange();

    const request: DataQueryRequest = {
      app: CoreApp.Dashboard,
      requestId: uuidv4(),
      timezone: '',
      range,
      interval: '',
      intervalMs: 0,
      targets: [target],
      scopedVars,
      startTime: Date.now(),
    };
    return request;
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <VariableValueSelect model={model} />;
  };
}
