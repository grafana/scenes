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

export interface StateTransactionCommittedPayload {
  /** The object that owns the change - used e.g. to republish a follow-up notification after
   * undo/redo, or to select it back into view. */
  source: SceneObject;
  /** Short, human-readable summary of what changed (e.g. "Resize panel"), for a host app's undo
   * history UI. The generic scenes bus has no way to derive this itself - only the dispatcher
   * knows what kind of change this was. */
  description: string;
  /** Re-applies the change. Already applied once by the time this event is published - only
   * meaningfully invoked again on redo. Must be safe to call more than once. */
  replay: () => void;
  /** Reverses the change back to the state before `replay` was first called. */
  revert: () => void;
}

/**
 * Published by a SceneObject after it applies a discrete, user-driven change it wants to be
 * undoable - a "transaction" already committed to state, distinct from
 * SceneObjectStateChangedEvent which fires on every setState regardless of cause. A generic
 * listener can record `{ perform: replay, undo: revert }` from this without knowing anything
 * about what kind of object or gesture produced it - the dispatcher is free to mutate however
 * many objects it needs to and however it likes, as long as `revert` undoes all of it.
 *
 * If nothing is listening, this is a no-op notification: the dispatching object already applied
 * the change itself and behaves exactly as if undo/redo support didn't exist.
 */
export class StateTransactionCommittedEvent extends BusEventWithPayload<StateTransactionCommittedPayload> {
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
