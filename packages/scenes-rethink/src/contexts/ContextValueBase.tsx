import { EventBus, EventBusSrv } from '@grafana/data';
import { Unsubscribable } from 'rxjs';
import { ContextValueChangedEvent, ContextValueChangedEventHandler } from './types';

export class ContextValueBase<TState> {
  #state: TState;

  protected _events: EventBus;

  public constructor(state: TState) {
    this.#state = state;
    this._events = new EventBusSrv();
  }

  public setState(update: Partial<TState>) {
    const prevState = this.#state;
    const newState: TState = {
      ...this.state,
      ...update,
    };

    this.#state = Object.freeze(newState);
    this._events.publish(new ContextValueChangedEvent({ prevState, newState }));
  }

  public subscribeToState(handler: ContextValueChangedEventHandler<TState>): Unsubscribable {
    return this._events!.subscribe(ContextValueChangedEvent, (event) => {
      handler(event.payload.newState as TState, event.payload.prevState as TState);
    });
  }

  public get state() {
    return this.#state;
  }
}
