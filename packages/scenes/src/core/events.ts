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

/**
 * Notify the url sync manager of a new object that has been added to the scene
 * that needs to init state from URL.
 */
export class NewSceneObjectAddedEvent extends BusEventWithPayload<SceneObject> {
  public static readonly type = 'new-scene-object-added';
}
