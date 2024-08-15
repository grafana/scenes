import { BusEvent, BusEventHandler, BusEventType, EventBus, EventFilterOptions } from '@grafana/data';
import { DashboardCursorSync } from '@grafana/schema';
import { Observable, Unsubscribable } from 'rxjs';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState } from '../core/types';

interface CursorSyncState extends SceneObjectState {
  sync: DashboardCursorSync;
}

/**
 * This behavior will provide a cursor sync context within a scene.
 */

export class CursorSync extends SceneObjectBase<CursorSyncState> {
  public constructor(state: Partial<CursorSyncState>) {
    super({
      ...state,
      sync: state.sync || DashboardCursorSync.Off,
    });
  }

  public getEventsBus = (panel: SceneObject) => {
    if (!this.parent) {
      throw new Error('EnableCursorSync cannot be used as a standalone scene object');
    }
    // Since EnableCursorSync is a behavior, it is not a parent to any object in the scene graph.
    // We need to get it's parent in order to provide correct EventBus context to the children.
    return new PanelContextEventBus(this.parent, panel);
  };

  public getEventsScope() {
    if (!this.parent) {
      throw new Error('EnableCursorSync cannot be used as a standalone scene object');
    }

    // Since EnableCursorSync is a behavior, it is not a parent to any object in the scene graph.
    // We need to get it's parent in order to provide correct EventBus context to the children.
    return this.state.key!;
  }
}

// This serves as a shared EventsBus that is shared by children or CursorSync behavior.
class PanelContextEventBus implements EventBus {
  public constructor(private _source: SceneObject, private _eventsOrigin: SceneObject) {}

  public publish<T extends BusEvent>(event: T): void {
    (event as any).origin = this;
    this._eventsOrigin.publishEvent(event, true);
  }

  public getStream<T extends BusEvent>(eventType: BusEventType<T>): Observable<T> {
    return new Observable<T>((observer) => {
      const handler = (event: T) => {
        observer.next(event);
      };

      const sub = this._source.subscribeToEvent(eventType, handler);

      return () => sub.unsubscribe();
    });
  }

  public subscribe<T extends BusEvent>(eventType: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable {
    return this.getStream(eventType).pipe().subscribe(handler);
  }

  public removeAllListeners(): void {}

  public newScopedBus(key: string, filter: EventFilterOptions): EventBus {
    throw new Error('For internal use only');
  }
}

export function getCursorSyncScope(sceneObject: SceneObject): CursorSync | null {
  return sceneGraph.findObject(sceneObject, (o) => o instanceof CursorSync) as CursorSync;
}
