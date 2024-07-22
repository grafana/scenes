import { DataQueryRequest, DataSourceApi, DataSourceJsonData, PanelData } from '@grafana/data';
import { defer, lastValueFrom, Observable } from 'rxjs';
import { DataQuery } from '@grafana/schema';
import { getRunRequest } from '@grafana/runtime';
import pLimit from 'p-limit';

let sceneQueryRunnerStore: SceneQueryRunnerQueue;
export function initSceneQueryRunnerQueue(props: SceneQueryRunnerQueueProps): void {
  if (!sceneQueryRunnerStore) {
    sceneQueryRunnerStore = new SceneQueryRunnerQueue(props);
  }
}

const runRequestFn = getRunRequest();

export class SceneQueryRunnerQueue {
  private limit
  public constructor(props: SceneQueryRunnerQueueProps) {
    this.limit = pLimit(props.maxConcurrentQueries);
  }

  public queueRequest = (ds: DataSourceApi<DataQuery, DataSourceJsonData, {}>, request: DataQueryRequest<DataQuery>): Observable<PanelData> => {
    const response = this.limit(() => lastValueFrom(runRequestFn(ds, request)))
    return defer(() => response)
  }
}

export function getSceneQueryRunnerQueue(initialState: SceneQueryRunnerQueueProps): SceneQueryRunnerQueue {
  if(!sceneQueryRunnerStore){
    initSceneQueryRunnerQueue(initialState)
  }

  return sceneQueryRunnerStore
}

export interface SceneQueryRunnerQueueProps {
  maxConcurrentQueries: number;
}

