import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneStatelessBehavior } from '../core/types';
import { DataQueryRequest } from '@grafana/data';

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
}

export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;

  cancelAll(): void;
  queryStarted(entry: SceneQueryControllerEntry): () => void;
}

export function isQueryController(s: SceneObject | SceneStatelessBehavior): s is SceneQueryControllerLike {
  return 'isQueryController' in s;
}

export type SceneQueryType = 'data' | 'annotations' | 'panel' | 'variable' | 'alerts';

export interface SceneQueryControllerEntry {
  query?: DataQueryRequest;
  type: SceneQueryType;
  source?: SceneObject;
  cancel: () => void;
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

  public cancelAll() {
    for (const query of this.#running.values()) {
      query.cancel();
    }
  }
}
