import { BusEventWithPayload } from '@grafana/data';

import { SceneObject, SceneObjectState } from './types';

export interface SceneObjectStateChangedPayload<TState extends SceneObjectState = SceneObjectState> {
  prevState: TState;
  newState: TState;
  partialUpdate: Partial<TState>;
  changedObject: SceneObject<TState>;
}

export class SceneObjectStateChangedEvent extends BusEventWithPayload<SceneObjectStateChangedPayload> {
  public static readonly type = 'scene-object-state-change';
}

export interface StateCommittedPayload {
  source: SceneObject;
  description: string;
  replay: () => void;
  revert: () => void;
}

/**
 * Published by a SceneObject after it applies a discrete, user-driven change it wants to be
 * undoable after already committed to state
 */
export class StateCommittedEvent extends BusEventWithPayload<StateCommittedPayload> {
  public static readonly type = 'scene-object-state-transaction-committed';
}

type UserActionEventType =
  | 'panel-description-shown'
  | 'panel-status-message-clicked'
  | 'panel-cancel-query-clicked'
  | 'panel-menu-shown';

interface UserActionEventPayload {
  origin: SceneObject;
  interaction: UserActionEventType;
}
export class UserActionEvent extends BusEventWithPayload<UserActionEventPayload> {
  public static readonly type = 'scene-object-user-action';
}
