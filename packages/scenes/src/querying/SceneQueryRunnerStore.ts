import { DataQueryRequest, DataSourceApi, DataSourceJsonData, PanelData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';
import { asyncScheduler, delay, from, merge, Observable, of, queueScheduler, scheduled } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { getRunRequest } from '@grafana/runtime';

let sceneQueryRunnerStore: SceneQueryRunnerStore;
export function initializeSceneQueryRunnerStore(initialState: SceneQueryRunnerStoreProps): void {
  if (!sceneQueryRunnerStore) {
    console.log('initializeSceneQueryRunnerStore')
    sceneQueryRunnerStore = new SceneQueryRunnerStore(initialState);

  }
}

export class SceneQueryRunnerStore {
  public runRequest
  private observables: Observable<Observable<PanelData>> | undefined;
  private concurrencyLimit: number
  public constructor(props: SceneQueryRunnerStoreProps) {
    this.concurrencyLimit = props.maxConcurrentQueries;
    this.runRequest = (ds: DataSourceApi<DataQuery, DataSourceJsonData, {}>, request: DataQueryRequest<DataQuery>) => {

      const runRequestFn = () => {
        console.log('runRequest is called', request)
        return getRunRequest()
      }

      const subscription = queueScheduler.schedule<PanelData>(work => {
        console.log('actually firing queue sub')
        return runRequestFn()(ds, request)
      })
      const observableOfSub = of(subscription)


      const observableObservable = scheduled([runRequestFn()(ds, request)], queueScheduler).pipe(delay(2500))
      const observableObservable2 = scheduled([subscription], queueScheduler).pipe(delay(2500))
      if(this.observables){
        this.observables = merge(observableObservable, this.observables)
      }else{
        this.observables = observableObservable
      }

      observableObservable2.subscribe(value => {
        console.log('queue sub coming back', value)
      })

      // Currently only scheduling the return, need to schedule the request instead
      return observableObservable.pipe(
        mergeMap(
          observable => observable.pipe(obs => {
            return obs.pipe(mergeMap(obs => scheduled([obs], asyncScheduler).pipe(delay(2500)), 2))
          }), this.concurrencyLimit
        )
      )
    }
    console.log('SceneQueryRunnerStore constructor')
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


