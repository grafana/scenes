import { BusEventWithPayload } from '@grafana/data';

export class ContextValueChangedEvent extends BusEventWithPayload<{ newState: any; prevState: any }> {
  public static readonly type = 'context-value-changed';
}

export type ContextValueChangedEventHandler<TState> = (newState: TState, prevState: TState) => void;
