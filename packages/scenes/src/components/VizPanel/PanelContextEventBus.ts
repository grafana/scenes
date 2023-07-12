import { BusEvent, BusEventHandler, BusEventType, EventBus, EventFilterOptions } from '@grafana/data';
import { Observable, Unsubscribable } from 'rxjs';
import { SceneObject } from '../../core/types';

export class PanelContextEventBus implements EventBus {
  public constructor(private _panel: SceneObject) {}

  public publish<T extends BusEvent>(event: T): void {
    (event as any).origin = this;
    this._panel.publishEvent(event, true);
  }

  public getStream<T extends BusEvent>(eventType: BusEventType<T>): Observable<T> {
    return new Observable<T>((observer) => {
      const handler = (event: T) => {
        observer.next(event);
      };

      const sub = this._panel.subscribeToEvent(eventType, handler);

      return () => sub.unsubscribe();
    });
  }

  public subscribe<T extends BusEvent>(eventType: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable {
    return this._panel.subscribeToEvent(eventType, handler);
  }

  public removeAllListeners(): void {}

  public newScopedBus(key: string, filter: EventFilterOptions): EventBus {
    return this;
  }
}
