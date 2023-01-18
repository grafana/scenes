import {
  DataQuery,
  DataSourceJsonData,
  DataSourceApi,
  MetricFindValue,
  VariableSupportType,
  StandardVariableQuery,
  DataQueryRequest,
  DataQueryResponse,
} from '@grafana/data';

import { Observable } from 'rxjs';

/**
 * Interfaces and guards below are copied from core.
 * Not exposing via grafana/data as these are not intended to be used in context other than variables.
 */

interface DataSourceWithLegacyVariableSupport<
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
> extends DataSourceApi<TQuery, TOptions> {
  metricFindQuery(query: any, options?: any): Promise<MetricFindValue[]>;
  variables: undefined;
}

interface DataSourceWithStandardVariableSupport<
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
> extends DataSourceApi<TQuery, TOptions> {
  variables: {
    getType(): VariableSupportType;
    toDataQuery(query: StandardVariableQuery): TQuery;
    query(request: DataQueryRequest<TQuery>): Observable<DataQueryResponse>;
  };
}

export const hasLegacyVariableSupport = <
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
>(
  datasource: DataSourceApi<TQuery, TOptions>
): datasource is DataSourceWithLegacyVariableSupport<TQuery, TOptions> => {
  return Boolean(datasource.metricFindQuery) && !Boolean(datasource.variables);
};

export const hasStandardVariableSupport = <
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
>(
  datasource: DataSourceApi<TQuery, TOptions>
): datasource is DataSourceWithStandardVariableSupport<TQuery, TOptions> => {
  if (!datasource.variables) {
    return false;
  }

  if (datasource.variables.getType() !== VariableSupportType.Standard) {
    return false;
  }

  const variableSupport = datasource.variables;
  return 'toDataQuery' in variableSupport && Boolean(variableSupport.toDataQuery);
};
