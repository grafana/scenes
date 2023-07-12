import { DashboardCursorSync } from '@grafana/schema';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState } from '../core/types';

interface EnableCursorSyncState extends SceneObjectState {
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
    return this._events!.newScopedBus(this.state.key!, { onlyLocal: false });
  };
}

export function getCursorSyncScope(sceneObject: SceneObject): EnableCursorSync | null {
  return sceneGraph.findObject(sceneObject, (o) => o instanceof EnableCursorSync) as EnableCursorSync;
}
