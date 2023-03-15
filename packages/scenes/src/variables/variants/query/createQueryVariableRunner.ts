import { from, mergeMap, Observable, of } from 'rxjs';

import {
  DataQuery,
  DataQueryRequest,
  DataSourceApi,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
} from '@grafana/data';
import { getRunRequest } from '@grafana/runtime';

import { hasCustomVariableSupport, hasLegacyVariableSupport, hasStandardVariableSupport } from './guards';

import { QueryVariable } from './QueryVariable';

export interface RunnerArgs {
  searchFilter?: string;
  variable: QueryVariable;
}

export interface QueryRunner {
  getTarget: (variable: QueryVariable) => DataQuery;
  runRequest: (args: RunnerArgs, request: DataQueryRequest) => Observable<PanelData>;
}

class StandardQueryRunner implements QueryRunner {
  public constructor(private datasource: DataSourceApi, private _runRequest = getRunRequest()) {}

  public getTarget(variable: QueryVariable) {
    if (hasStandardVariableSupport(this.datasource)) {
      return this.datasource.variables.toDataQuery(variable.state.query);
    }

    throw new Error("Couldn't create a target with supplied arguments.");
  }

  public runRequest(_: RunnerArgs, request: DataQueryRequest) {
    if (!hasStandardVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }

    if (!this.datasource.variables.query) {
      return this._runRequest(this.datasource, request);
    }

    return this._runRequest(this.datasource, request, this.datasource.variables.query);
  }
}

class LegacyQueryRunner implements QueryRunner {
  public constructor(private datasource: DataSourceApi) {}

  public getTarget(variable: QueryVariable) {
    if (hasLegacyVariableSupport(this.datasource)) {
      return variable.state.query;
    }

    throw new Error("Couldn't create a target with supplied arguments.");
  }

  public runRequest({ variable }: RunnerArgs, request: DataQueryRequest) {
    if (!hasLegacyVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }

    return from(
      this.datasource.metricFindQuery(variable.state.query, {
        ...request,
        // variable is used by SQL common data source
        variable: {
          name: variable.state.name,
          type: variable.state.type,
        },
        // TODO: add support for search filter
        // searchFilter
      })
    ).pipe(
      mergeMap((values) => {
        if (!values || !values.length) {
          return getEmptyMetricFindValueObservable();
        }

        const series: any = values;
        return of({ series, state: LoadingState.Done, timeRange: request.range });
      })
    );
  }
}

class CustomQueryRunner implements QueryRunner {
  public constructor(private datasource: DataSourceApi, private _runRequest = getRunRequest()) {}

  public getTarget(variable: QueryVariable) {
    if (hasCustomVariableSupport(this.datasource)) {
      return variable.state.query;
    }

    throw new Error("Couldn't create a target with supplied arguments.");
  }

  public runRequest(_: RunnerArgs, request: DataQueryRequest) {
    if (!hasCustomVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }

    if (!this.datasource.variables.query) {
      return this._runRequest(this.datasource, request);
    }
    return this._runRequest(this.datasource, request, this.datasource.variables.query);
  }
}

function getEmptyMetricFindValueObservable(): Observable<PanelData> {
  return of({ state: LoadingState.Done, series: [], timeRange: getDefaultTimeRange() });
}

function createQueryVariableRunnerFactory(datasource: DataSourceApi): QueryRunner {
  if (hasStandardVariableSupport(datasource)) {
    return new StandardQueryRunner(datasource, getRunRequest());
  }

  if (hasLegacyVariableSupport(datasource)) {
    return new LegacyQueryRunner(datasource);
  }

  if (hasCustomVariableSupport(datasource)) {
    return new CustomQueryRunner(datasource);
  }

  throw new Error(`Couldn't create a query runner for datasource ${datasource.type}`);
}

export let createQueryVariableRunner = createQueryVariableRunnerFactory;

/**
 * Use only in tests
 */
export function setCreateQueryVariableRunnerFactory(fn: (datasource: DataSourceApi) => QueryRunner) {
  createQueryVariableRunner = fn;
}
