import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneStatelessBehavior } from '../core/types';
import { DataQueryRequest } from '@grafana/data';
import { Observable } from 'rxjs';
import { LoadingState } from '@grafana/schema';
import { sceneGraph } from '../core/sceneGraph';

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
}

export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;
  cancelAll(): void;

  queryStarted(entry: SceneQueryControllerEntry): void;
  queryCompleted(entry: SceneQueryControllerEntry): void;
}

export function isQueryController(s: SceneObject | SceneStatelessBehavior): s is SceneQueryControllerLike {
  return 'isQueryController' in s;
}

export type SceneQueryType = 'data' | 'annotations' | 'panel' | 'variable' | 'alerts';

export interface QueryResultWithState {
  state: LoadingState;
}

export interface SceneQueryControllerEntry {
  request?: DataQueryRequest;
  type: SceneQueryType;
  sceneObject: SceneObject;
  cancel?: () => void;
}

export class SceneQueryController
  extends SceneObjectBase<SceneQueryStateControllerState>
  implements SceneQueryControllerLike
{
  public isQueryController: true = true;

  #running = new Set<SceneQueryControllerEntry>();

  public constructor(state: Partial<SceneQueryStateControllerState>) {
    super({ isRunning: state.isRunning ?? false });
  }

  public queryStarted(entry: SceneQueryControllerEntry) {
    this.#running.add(entry);

    if (!this.state.isRunning) {
      this.setState({ isRunning: true });
    }
  }

  public queryCompleted(entry: SceneQueryControllerEntry) {
    this.#running.delete(entry);

    if (this.#running.size === 0) {
      this.setState({ isRunning: false });
    }
  }

  public cancelAll() {
    for (const entry of this.#running.values()) {
      entry.cancel?.();
    }
  }
}

export function registerQueryWithController<T extends QueryResultWithState>(entry: SceneQueryControllerEntry) {
  return (queryStream: Observable<T>) => {
    const queryControler = sceneGraph.getQueryController(entry.sceneObject);
    if (!queryControler) {
      return queryStream;
    }

    return new Observable<T>((observer) => {
      if (!entry.cancel) {
        entry.cancel = () => observer.complete();
      }

      queryControler.queryStarted(entry);

      const sub = queryStream.subscribe({
        next: (v) => {
          if (v.state !== LoadingState.Loading) {
            queryControler.queryCompleted(entry);
          }

          observer.next(v);
        },
        error: (e) => observer.error(e),
        complete: () => {
          observer.complete();
        },
      });

      return () => {
        sub.unsubscribe();
        queryControler.queryCompleted(entry);
      };
    });
  };
}
