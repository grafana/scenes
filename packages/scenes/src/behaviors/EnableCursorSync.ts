import { DataHoverEvent } from '@grafana/data';
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

    this.addActivationHandler(() => {
      const parent = this.parent!;

      parent!.subscribeToEvent(DataHoverEvent, (evt) => {
        broadcast(parent, this, evt);
      });
    });
  }
}

export function getCursorSyncScope(sceneObject: SceneObject): EnableCursorSync | null {
  return sceneGraph.findObject(sceneObject, (o) => o instanceof EnableCursorSync) as EnableCursorSync;
}

function broadcast(obj: SceneObject, syncBehavior: SceneObject, event: DataHoverEvent) {
  obj.forEachChild((child) => {
    if (child !== syncBehavior) {
      child.publishEvent(event, false);
      broadcast(child, syncBehavior, event);
    }
  });
}
