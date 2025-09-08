import { DataSourceApi, ScopedVars } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataSourceRef } from '@grafana/schema';
import { runtimeDataSources } from '../querying/RuntimeDataSource';
import { registerQueryWithController, wrapPromiseInStateObservable } from '../querying/registerQueryWithController';
import { SceneObject } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';

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

  const dsPromise = getDataSourceSrv().get(datasource as string, scopedVars);

  if (scopedVars.__sceneObject && scopedVars.__sceneObject.value.valueOf()) {
    const queryControler = sceneGraph.getQueryController(scopedVars.__sceneObject.value.valueOf() as SceneObject);
    if (queryControler && queryControler.state.enableProfiling) {
      wrapPromiseInStateObservable(dsPromise)
        .pipe(
          registerQueryWithController({
            type: `getDataSource/${datasource?.type ?? 'unknown'}`,
            origin: scopedVars.__sceneObject.value.valueOf() as SceneObject,
          })
        )
        .subscribe(() => {});
    }
  }

  const result = await dsPromise;
  return result;
}
