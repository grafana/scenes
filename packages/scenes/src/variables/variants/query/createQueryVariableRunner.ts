import { from, mergeMap, Observable, of } from 'rxjs';

import {
  DataQueryRequest,
  DataSourceApi,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  StandardVariableQuery,
} from '@grafana/data';
import { getRunRequest } from '@grafana/runtime';

import {
  hasCustomVariableSupport,
  hasDataSourceVariableSupport,
  hasLegacyVariableSupport,
  hasStandardVariableSupport,
} from './guards';

import { QueryVariable } from './QueryVariable';
import { DataQuery } from '@grafana/schema';

export interface RunnerArgs {
  searchFilter?: string;
  variable: QueryVariable;
}

export interface QueryRunner {
  getTarget: (variable: QueryVariable) => DataQuery | string;
  runRequest: (args: RunnerArgs, request: DataQueryRequest) => Observable<PanelData>;
}

class StandardQueryRunner implements QueryRunner {
  public constructor(private datasource: DataSourceApi, private _runRequest = getRunRequest()) {}

  public getTarget(variable: QueryVariable) {
    if (hasStandardVariableSupport(this.datasource)) {
      return this.datasource.variables.toDataQuery(ensureVariableQueryModelIsADataQuery(variable));
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

    return this._runRequest(this.datasource, request, this.datasource.variables.query.bind(this.datasource.variables));
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

  public runRequest({ variable, searchFilter }: RunnerArgs, request: DataQueryRequest) {
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
        searchFilter,
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
    return this._runRequest(this.datasource, request, this.datasource.variables.query.bind(this.datasource.variables));
  }
}

const variableDummyRefId = 'variable-query';
class DatasourceQueryRunner implements QueryRunner {
  public constructor(private datasource: DataSourceApi, private _runRequest = getRunRequest()) {}

  public getTarget(variable: QueryVariable) {
    if (hasDataSourceVariableSupport(this.datasource)) {
      if (typeof variable.state.query === 'string') {
        return variable.state.query;
      }

      return { ...variable.state.query, refId: variable.state.query.refId ?? variableDummyRefId };
    }

    throw new Error("Couldn't create a target with supplied arguments.");
  }

  public runRequest(_: RunnerArgs, request: DataQueryRequest) {
    if (!hasDataSourceVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }

    return this._runRequest(this.datasource, request);
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

  if (hasDataSourceVariableSupport(datasource)) {
    return new DatasourceQueryRunner(datasource);
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

/**
 * Fixes old legacy query string models and adds refId if missing
 */
function ensureVariableQueryModelIsADataQuery(variable: QueryVariable): StandardVariableQuery {
  const query = variable.state.query ?? '';

  // Turn into query object if it's just a string
  if (typeof query === 'string') {
    return { query, refId: `variable-${variable.state.name}` };
  }

  // Add potentially missing refId
  if (query.refId == null) {
    return { ...query, refId: `variable-${variable.state.name}` } as StandardVariableQuery;
  }

  return variable.state.query as StandardVariableQuery;
}
