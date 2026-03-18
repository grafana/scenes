import {
  DataQuery,
  DataSourceJsonData,
  DataSourceApi,
  MetricFindValue,
  VariableSupportType,
  StandardVariableQuery,
  DataQueryRequest,
  DataQueryResponse,
  QueryEditorProps,
} from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';
import { ComponentType } from 'react';

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

interface DataSourceWithCustomVariableSupport<
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
> extends DataSourceApi<TQuery, TOptions> {
  variables: {
    getType(): VariableSupportType;
    editor: VariableQueryEditorType;
    query(request: DataQueryRequest<TQuery>): Observable<DataQueryResponse>;
  };
}

interface VariableQueryEditorProps {
  query: any;
  onChange: (query: any, definition: string) => void;
  datasource: any;
  templateSrv: TemplateSrv;
}

type VariableQueryEditorType<
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
> = ComponentType<VariableQueryEditorProps> | ComponentType<QueryEditorProps<any, TQuery, TOptions, any>> | null;

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

export const hasCustomVariableSupport = <
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
>(
  datasource: DataSourceApi<TQuery, TOptions>
): datasource is DataSourceWithCustomVariableSupport<TQuery, TOptions> => {
  if (!datasource.variables) {
    return false;
  }

  if (datasource.variables.getType() !== VariableSupportType.Custom) {
    return false;
  }

  const variableSupport = datasource.variables;
  return (
    'query' in variableSupport &&
    'editor' in variableSupport &&
    Boolean(variableSupport.query) &&
    Boolean(variableSupport.editor)
  );
};

export const hasDataSourceVariableSupport = <
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData
>(
  datasource: DataSourceApi<TQuery, TOptions>
): datasource is DataSourceWithCustomVariableSupport<TQuery, TOptions> => {
  if (!datasource.variables) {
    return false;
  }

  return datasource.variables.getType() === VariableSupportType.Datasource;
};
