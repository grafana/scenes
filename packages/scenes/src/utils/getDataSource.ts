import { DataSourceApi, ScopedVars } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataSourceRef } from '@grafana/schema';

export async function getDataSource(
  datasource: DataSourceRef | undefined,
  scopedVars: ScopedVars
): Promise<DataSourceApi> {
  if (datasource && (datasource as any).query) {
    return datasource as DataSourceApi;
  }

  return await getDataSourceSrv().get(datasource as string, scopedVars);
}
