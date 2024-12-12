import { getDataSourceSrv } from '@grafana/runtime';
import { runtimeDataSources } from '../querying/RuntimeDataSource.js';

async function getDataSource(datasource, scopedVars) {
  if (datasource == null ? void 0 : datasource.uid) {
    const runtimeDataSource = runtimeDataSources.get(datasource.uid);
    if (runtimeDataSource) {
      return runtimeDataSource;
    }
  }
  if (datasource && datasource.query) {
    return datasource;
  }
  return await getDataSourceSrv().get(datasource, scopedVars);
}

export { getDataSource };
//# sourceMappingURL=getDataSource.js.map
