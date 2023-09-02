import { DataSourceApi, ScopedVars } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataSourceRef } from '@grafana/schema';
import { runtimeDataSources } from '../querying/RuntimeDataSource';

export async function getDataSource(
  datasource: DataSourceRef | undefined | null,
  scopedVars: ScopedVars
): Promise<DataSourceApi> {
  if (datasource?.uid) {
    const runtimeDataSource = runtimeDataSources.get(datasource.uid);
    if (runtimeDataSource) {
      return runtimeDataSource;
    }
  }

  if (datasource && (datasource as any).query) {
    return datasource as DataSourceApi;
  }

  return await getDataSourceSrv().get(datasource as string, scopedVars);
}
