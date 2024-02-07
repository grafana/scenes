import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneStatelessBehavior } from '../core/types';
import { DataQueryRequest } from '@grafana/data';
import { Observable } from 'rxjs';
import { LoadingState } from '@grafana/schema';

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
}

export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;
  cancelAll(): void;

  /**
   * This wraps the query observable to be able to spy on the running state of the query
   * and be able to cancel it
   */
  registerQuery<T extends QueryResultWithState>(entry: SceneQueryControllerEntry<T>): Observable<T>;
}

export function isQueryController(s: SceneObject | SceneStatelessBehavior): s is SceneQueryControllerLike {
  return 'isQueryController' in s;
}

export type SceneQueryType = 'data' | 'annotations' | 'panel' | 'variable' | 'alerts';

export interface QueryResultWithState {
  state: LoadingState;
}

export interface SceneQueryControllerEntry<T extends QueryResultWithState = QueryResultWithState> {
  request?: DataQueryRequest;
  type: SceneQueryType;
  sceneObject?: SceneObject;
  runStream: Observable<T>;
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

    return () => {
      this.#running.delete(entry);

      if (this.#running.size === 0) {
        this.setState({ isRunning: false });
      }
    };
  }

  public registerQuery<T extends QueryResultWithState>(entry: SceneQueryControllerEntry<T>): Observable<T> {
    const obs = new Observable<T>((observer) => {
      if (!entry.cancel) {
        entry.cancel = () => observer.complete();
      }

      this.#running.add(entry);

      if (!this.state.isRunning) {
        this.setState({ isRunning: true });
      }

      const sub = entry.runStream.subscribe({
        next: (v) => observer.next(v),
        error: (e) => observer.error(e),
        complete: () => {
          observer.complete();
        },
      });

      return () => {
        sub.unsubscribe();
        this.queryCompleted(entry);
      };
    });

    return obs;
  }

  private queryCompleted(entry: SceneQueryControllerEntry) {
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
