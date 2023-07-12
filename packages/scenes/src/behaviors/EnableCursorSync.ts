import { DashboardCursorSync } from '@grafana/schema';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState } from '../core/types';

interface EnableCursorSyncState extends SceneObjectState {
  // The name of the variable to subscribe to changes to.
  sync: DashboardCursorSync;
}

/**
 * This behavior will provide a cursor sync context within a scene.
 */

export class EnableCursorSync extends SceneObjectBase<EnableCursorSyncState> {
  public constructor(state: Partial<EnableCursorSyncState>) {
    super({
      ...state,
      sync: state.sync || DashboardCursorSync.Off,
    });
  }

  public getEventsBus = () => {
    return this._events.newScopedBus(this.state.key!);
  };
}

export function getCursorSyncScope(sceneObject: SceneObject): EnableCursorSync | null {
  let sync;

  sceneObject.forEachChild((child) => {
    if (child instanceof EnableCursorSync) {
      sync = child;
    }
  });

  if (sync) {
    return sync;
  }
  if (sceneObject.parent) {
    return getCursorSyncScope(sceneObject.parent);
  }
  return null;
}
