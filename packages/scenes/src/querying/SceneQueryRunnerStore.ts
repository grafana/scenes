import { DataQueryRequest, DataSourceApi, DataSourceJsonData, PanelData } from '@grafana/data';
import { from, mergeAll, Observable } from 'rxjs';
import { DataQuery } from '@grafana/schema';
import pLimit from 'p-limit';
import { getRunRequest } from '@grafana/runtime';

let sceneQueryRunnerStore: SceneQueryRunnerStore;
export function initializeSceneQueryRunnerStore(initialState: SceneQueryRunnerStoreProps): void {
  if (!sceneQueryRunnerStore) {
    console.log('initializeSceneQueryRunnerStore')
    sceneQueryRunnerStore = new SceneQueryRunnerStore(initialState);

  }
}

export class SceneQueryRunnerStore {
  // private limit
  public constructor(props: SceneQueryRunnerStoreProps) {
    // this.limit = pLimit(1);
  }

  public runRequest = (ds: DataSourceApi<DataQuery, DataSourceJsonData, {}>, request: DataQueryRequest<DataQuery>): Observable<PanelData> => {
    // const response = this.limit(() => getRunRequest()(ds, request))
    // const obsObs = from(response)
    // return obsObs.pipe(mergeAll())
    return getRunRequest()(ds, request)
  }
}

export function getSceneQueryRunnerStore(initialState: SceneQueryRunnerStoreProps): SceneQueryRunnerStore {
  if(!sceneQueryRunnerStore){
    initializeSceneQueryRunnerStore(initialState)
  }

  return sceneQueryRunnerStore
}


export interface SceneQueryRunnerStoreProps {
  maxConcurrentQueries: number;
}


