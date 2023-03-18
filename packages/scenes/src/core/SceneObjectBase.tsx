import { useEffect } from 'react';
import { Subscription, Unsubscribable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { BusEvent, BusEventHandler, BusEventType, EventBusSrv } from '@grafana/data';
import {
  SceneObject,
  SceneComponent,
  SceneObjectState,
  SceneObjectUrlSyncHandler,
  SceneStateChangedHandler,
  SceneActivationHandler,
  SceneDeactivationHandler,
} from './types';
import { useForceUpdate } from '@grafana/ui';

import { SceneComponentWrapper } from './SceneComponentWrapper';
import { SceneObjectStateChangedEvent } from './events';
import { cloneSceneObject, forEachSceneObjectInState } from './utils';
import { SceneVariableDependencyConfigLike } from '../variables/types';

export abstract class SceneObjectBase<TState extends SceneObjectState = SceneObjectState>
  implements SceneObject<TState>
{
  private _isActive = false;
  private _state: TState;
  private _events = new EventBusSrv();
  private _activationHandlers: SceneActivationHandler[] = [];
  private _deactivationHandlers: SceneDeactivationHandler[] = [];

  protected _parent?: SceneObject;
  protected _subs = new Subscription();

  protected _variableDependency: SceneVariableDependencyConfigLike | undefined;
  protected _urlSync: SceneObjectUrlSyncHandler<TState> | undefined;

  public constructor(state: TState) {
    if (!state.key) {
      state.key = uuidv4();
    }

    this._state = Object.freeze(state);
    this.setParent();
  }

  /** Current state */
  public get state(): TState {
    return this._state;
  }

  /** True if currently being active (ie displayed for visual objects) */
  public get isActive(): boolean {
    return this._isActive;
  }

  /** Returns the parent, undefined for root object */
  public get parent(): SceneObject | undefined {
    return this._parent;
  }

  /** Returns variable dependency config */
  public get variableDependency(): SceneVariableDependencyConfigLike | undefined {
    return this._variableDependency;
  }

  /** Returns url sync config */
  public get urlSync(): SceneObjectUrlSyncHandler<TState> | undefined {
    return this._urlSync;
  }

  /**
   * Used in render functions when rendering a SceneObject.
   * Wraps the component in an EditWrapper that handles edit mode
   */
  public get Component(): SceneComponent<this> {
    return SceneComponentWrapper;
  }

  private setParent() {
    forEachSceneObjectInState(this._state, (child) => (child._parent = this));
  }

  /**
   * Subscribe to the scene state subject
   **/
  public subscribeToState(handler: SceneStateChangedHandler<TState>): Unsubscribable {
    return this._events.subscribe(SceneObjectStateChangedEvent, (event) => {
      if (event.payload.changedObject === this) {
        handler(event.payload.newState as TState, event.payload.prevState as TState);
      }
    });
  }

  /**
   * Subscribe to the scene event
   **/
  public subscribeToEvent<T extends BusEvent>(eventType: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable {
    return this._events.subscribe(eventType, handler);
  }

  public setState(update: Partial<TState>) {
    const prevState = this._state;
    const newState: TState = {
      ...this._state,
      ...update,
    };

    this._state = Object.freeze(newState);

    this.setParent();

    // Bubble state change event. This is event is subscribed to by UrlSyncManager and UndoManager
    this.publishEvent(
      new SceneObjectStateChangedEvent({
        prevState,
        newState,
        partialUpdate: update,
        changedObject: this,
      }),
      true
    );
  }
  /*
   * Publish an event and optionally bubble it up the scene
   **/
  public publishEvent(event: BusEvent, bubble?: boolean) {
    this._events.publish(event);

    if (bubble && this.parent) {
      this.parent.publishEvent(event, bubble);
    }
  }

  public getRoot(): SceneObject {
    return !this._parent ? this : this._parent.getRoot();
  }

  /**
   * Called by the SceneComponentWrapper when the react component is mounted.
   * Don't override this, instead use addActivationHandler
   */
  public activate() {
    this._isActive = true;

    const { $data, $variables, $timeRange } = this.state;

    if ($timeRange && !$timeRange.isActive) {
      $timeRange.activate();
    }

    if ($variables && !$variables.isActive) {
      $variables.activate();
    }

    if ($data && !$data.isActive) {
      $data.activate();
    }

    this._activationHandlers.forEach((handler) => {
      const result = handler();
      if (result) {
        this._deactivationHandlers.push(result);
      }
    });
  }

  /**
   * Called by the SceneComponentWrapper when the react component is unmounted.
   * Don't override this, instead use addActivationHandler. The activation handler can return a deactivation handler.
   */
  public deactivate(): void {
    this._isActive = false;

    const { $data, $variables, $timeRange } = this.state;

    if ($timeRange && $timeRange.isActive) {
      $timeRange.deactivate();
    }

    if ($data && $data.isActive) {
      $data.deactivate();
    }

    if ($variables && $variables.isActive) {
      $variables.deactivate();
    }

    this._deactivationHandlers.forEach((handler) => handler());
    this._deactivationHandlers = [];

    // Clear subscriptions and listeners
    this._events.removeAllListeners();
    this._subs.unsubscribe();
    this._subs = new Subscription();
  }

  /**
   * Utility hook to get and subscribe to state
   */
  public useState() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSceneObjectState(this);
  }

  /** Force a re-render, should only be needed when variable values change */
  public forceRender(): void {
    this.setState({});
  }

  /**
   * Will create new SceneObject with shallow-cloned state, but all state items of type SceneObject are deep cloned
   */
  public clone(withState?: Partial<TState>): this {
    return cloneSceneObject(this, withState);
  }

  /**
   * Allows external code to register code that is executed on activate and deactivate. This allow you
   * to wire up scene objects that need to respond to state changes in other objects from the outside.
   **/
  public addActivationHandler(handler: SceneActivationHandler) {
    this._activationHandlers.push(handler);
  }
}

/**
 * This hook is always returning model.state instead of a useState that remembers the last state emitted on the subject
 * The reason for this is so that if the model instance change this function will always return the latest state.
 */
function useSceneObjectState<TState extends SceneObjectState>(model: SceneObjectBase<TState>): TState {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const s = model.subscribeToState(forceUpdate);
    return () => s.unsubscribe();
  }, [model, forceUpdate]);

  return model.state;
}
