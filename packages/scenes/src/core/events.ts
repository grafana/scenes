import { BusEventWithPayload } from '@grafana/data';

import { SceneObject, SceneObjectStatePlain } from './types';

export interface SceneObjectStateChangedPayload<TState extends SceneObjectStatePlain = SceneObjectStatePlain> {
  prevState: TState;
  newState: TState;
  partialUpdate: Partial<TState>;
  changedObject: SceneObject<TState>;
}

export class SceneObjectStateChangedEvent extends BusEventWithPayload<SceneObjectStateChangedPayload> {
  public static readonly type = 'scene-object-state-change';
}
