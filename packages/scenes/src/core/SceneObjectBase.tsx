import { useEffect, useState } from 'react';
import { Subscription, Unsubscribable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { BusEvent, BusEventHandler, BusEventType, EventBus, EventBusSrv } from '@grafana/data';
import {
  SceneObject,
  SceneComponent,
  SceneObjectUrlSyncHandler,
  SceneStateChangedHandler,
  SceneActivationHandler,
  SceneDeactivationHandler,
  CancelActivationHandler,
  SceneObjectState,
  UseStateHookOptions,
  SceneStatelessBehavior,
} from './types';

import { SceneComponentWrapper } from './SceneComponentWrapper';
import { SceneObjectStateChangedEvent } from './events';
import { cloneSceneObject } from './sceneGraph/cloneSceneObject';
import { SceneVariableDependencyConfigLike } from '../variables/types';
import { SceneObjectRef } from './SceneObjectRef';

export abstract class SceneObjectBase<TState extends SceneObjectState = SceneObjectState>
  implements SceneObject<TState>
{
  private _isActive = false;
  private _state: TState;
  private _activationHandlers: SceneActivationHandler[] = [];
  private _deactivationHandlers = new Map<object, SceneDeactivationHandler>();
  private _ref?: SceneObjectRef<this>;

  protected _events?: EventBus;
  protected _parent?: SceneObject;
  protected _subs = new Subscription();
  protected _refCount = 0;
  protected _renderBeforeActivation = false;

  protected _variableDependency: SceneVariableDependencyConfigLike | undefined;
  protected _urlSync: SceneObjectUrlSyncHandler | undefined;

  public constructor(state: TState) {
    if (!state.key) {
      state.key = uuidv4();
    }

    this._events = new EventBusSrv();

    this._state = Object.freeze(state);
    this._setParent(this._state);
  }

  /** Current state */
  public get state(): TState {
    return this._state;
  }

  /** True if currently being active (ie displayed for visual objects) */
  public get isActive(): boolean {
    return this._isActive;
  }

  public get renderBeforeActivation(): boolean {
    return this._renderBeforeActivation;
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
  public get urlSync(): SceneObjectUrlSyncHandler | undefined {
    return this._urlSync;
  }

  /**
   * Used in render functions when rendering a SceneObject.
   * Wraps the component in an EditWrapper that handles edit mode
   */
  public get Component(): SceneComponent<this> {
    return SceneComponentWrapper as SceneComponent<this>;
  }

  private _setParent(state: Partial<TState>) {
    forEachChild(state, (child) => {
      // If we already have a parent and it's not this, then we likely have a bug
      if (child._parent && child._parent !== this) {
        console.warn(
          'SceneObject already has a parent set that is different from the new parent. You cannot share the same SceneObject instance in multiple scenes or in multiple different places of the same scene graph. Use SceneObject.clone() to duplicate a SceneObject or store a state key reference and use sceneGraph.findObject to locate it.',
          child,
          this
        );
      }
      child._parent = this;
    });
  }

  /**
   * Sometimes you want to move one instance to another parent.
   * This is a way to do that without getting the console warning.
   */
  public clearParent() {
    this._parent = undefined;
  }

  /**
   * Subscribe to the scene state subject
   **/
  public subscribeToState(handler: SceneStateChangedHandler<TState>): Unsubscribable {
    return this._events!.subscribe(SceneObjectStateChangedEvent, (event) => {
      if (event.payload.changedObject === this) {
        handler(event.payload.newState as TState, event.payload.prevState as TState);
      }
    });
  }

  /**
   * Subscribe to the scene event
   **/
  public subscribeToEvent<T extends BusEvent>(eventType: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable {
    return this._events!.subscribe(eventType, handler);
  }

  public setState(update: Partial<TState>) {
    const prevState = this._state;
    const newState: TState = {
      ...this._state,
      ...update,
    };

    this._state = Object.freeze(newState);
    this._setParent(update);

    // Handles cases when $data, $timeRange, or $variables are changed
    this._handleActivationOfChangedStateProps(prevState, newState);

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

  /**
   * This handles activation and deactivation of $data, $timeRange and $variables when they change
   * during the active phase of the scene object.
   */
  private _handleActivationOfChangedStateProps(prevState: TState, newState: TState) {
    if (!this.isActive) {
      return;
    }

    if (prevState.$behaviors !== newState.$behaviors) {
      this._handleChangedBehaviors(prevState.$behaviors, newState.$behaviors);
    }

    if (prevState.$data !== newState.$data) {
      this._handleChangedStateActivation(prevState.$data, newState.$data);
    }

    if (prevState.$variables !== newState.$variables) {
      this._handleChangedStateActivation(prevState.$variables, newState.$variables);
    }

    if (prevState.$timeRange !== newState.$timeRange) {
      this._handleChangedStateActivation(prevState.$timeRange, newState.$timeRange);
    }
  }

  private _handleChangedStateActivation(oldValue: SceneObject | undefined, newValue: SceneObject | undefined) {
    if (oldValue) {
      const deactivationHandler = this._deactivationHandlers.get(oldValue);
      if (deactivationHandler) {
        deactivationHandler();
        this._deactivationHandlers.delete(oldValue);
      }
    }

    if (newValue) {
      this._deactivationHandlers.set(newValue, newValue.activate());
    }
  }

  private _handleChangedBehaviors(
    oldValue: Array<SceneObject | SceneStatelessBehavior> | undefined,
    newValue: Array<SceneObject | SceneStatelessBehavior> | undefined
  ) {
    // Handle removed behaviors
    if (oldValue) {
      for (const oldBehavior of oldValue) {
        if (!newValue || !newValue.includes(oldBehavior)) {
          const deactivationHandler = this._deactivationHandlers.get(oldBehavior);
          if (deactivationHandler) {
            deactivationHandler();
            this._deactivationHandlers.delete(oldBehavior);
          }
        }
      }
    }

    // Handle new behaviors
    if (newValue) {
      for (const newBehavior of newValue) {
        if (!oldValue || !oldValue.includes(newBehavior)) {
          this._activateBehavior(newBehavior);
        }
      }
    }
  }

  /*
   * Publish an event and optionally bubble it up the scene
   **/
  public publishEvent(event: BusEvent, bubble?: boolean) {
    this._events!.publish(event);

    if (bubble && this.parent) {
      this.parent.publishEvent(event, bubble);
    }
  }

  public getRoot(): SceneObject {
    return !this._parent ? this : this._parent.getRoot();
  }

  private _internalActivate() {
    this._isActive = true;

    const { $data, $variables, $timeRange, $behaviors } = this.state;

    this._activationHandlers.forEach((handler) => {
      const result = handler();
      if (result) {
        this._deactivationHandlers.set(result, result);
      }
    });

    if ($timeRange && !$timeRange.isActive) {
      this._deactivationHandlers.set($timeRange, $timeRange.activate());
    }

    if ($variables && !$variables.isActive) {
      this._deactivationHandlers.set($variables, $variables.activate());
    }

    if ($data && !$data.isActive) {
      this._deactivationHandlers.set($data, $data.activate());
    }

    if ($behaviors) {
      for (const behavior of $behaviors) {
        this._activateBehavior(behavior);
      }
    }
  }

  private _activateBehavior(behavior: SceneObject | SceneStatelessBehavior): SceneDeactivationHandler | void {
    if (behavior instanceof SceneObjectBase) {
      this._deactivationHandlers.set(behavior, behavior.activate());
    } else if (typeof behavior === 'function') {
      const deactivate = behavior(this);
      if (deactivate) {
        this._deactivationHandlers.set(behavior, deactivate);
      }
    }
  }

  /**
   * This is primarily called from SceneComponentWrapper when the SceneObject's Component is mounted.
   * But in some scenarios this can also be called directly from another scene object. When called manually from another scene object
   * make sure to call the returned function when the source scene object is deactivated.
   */
  public activate(): CancelActivationHandler {
    if (!this.isActive) {
      this._internalActivate();
    }

    this._refCount++;

    let called = false;

    return () => {
      this._refCount--;

      if (called) {
        const msg = `SceneObject cancelation handler returned by activate() called a second time`;
        throw new Error(msg);
      }

      called = true;

      if (this._refCount === 0) {
        this._internalDeactivate();
      }
    };
  }

  /**
   * Called by the SceneComponentWrapper when the react component is unmounted.
   * Don't override this, instead use addActivationHandler. The activation handler can return a deactivation handler.
   */
  private _internalDeactivate(): void {
    this._isActive = false;

    for (let handler of this._deactivationHandlers.values()) {
      handler();
    }

    this._deactivationHandlers.clear();

    // Clear subscriptions and listeners
    this._events!.removeAllListeners();
    this._subs.unsubscribe();
    this._subs = new Subscription();
  }

  /**
   * Utility hook to get and subscribe to state
   */
  public useState(): TState {
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

  /**
   * Loop through state and call callback for each direct child scene object.
   * Checks 1 level deep properties and arrays. So a scene object hidden in a nested plain object will not be detected.
   */
  public forEachChild(callback: (child: SceneObjectBase) => void) {
    forEachChild(this.state, callback);
  }

  /** Returns a SceneObjectRef that will resolve to this object */
  public getRef(): SceneObjectRef<this> {
    if (!this._ref) {
      this._ref = new SceneObjectRef(this);
    }

    return this._ref;
  }

  public toJSON() {
    return {
      type: Object.getPrototypeOf(this).constructor.name,
      isActive: this.isActive,
      state: this.state,
    };
  }
}

/**
 * This hook is always returning model.state instead of a useState that remembers the last state emitted on the subject
 * The reason for this is so that if the model instance change this function will always return the latest state.
 */
export function useSceneObjectState<TState extends SceneObjectState>(
  model: SceneObject<TState>,
  options?: UseStateHookOptions
): TState {
  const [_, setState] = useState<TState>(model.state);
  const stateAtFirstRender = model.state;
  const shouldActivateOrKeepAlive = options?.shouldActivateOrKeepAlive ?? false;

  useEffect(() => {
    let unactivate: CancelActivationHandler | undefined;

    if (shouldActivateOrKeepAlive) {
      unactivate = model.activate();
    }

    const s = model.subscribeToState((state) => {
      setState(state);
    });

    // Re-render component if the state changed between first render and useEffect (mount)
    if (model.state !== stateAtFirstRender) {
      setState(model.state);
    }

    return () => {
      s.unsubscribe();

      if (unactivate) {
        unactivate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, shouldActivateOrKeepAlive]);

  return model.state;
}

function forEachChild<T extends object>(state: T, callback: (child: SceneObjectBase) => void) {
  for (const propValue of Object.values(state)) {
    if (propValue instanceof SceneObjectBase) {
      callback(propValue);
    }

    if (Array.isArray(propValue)) {
      for (const child of propValue) {
        if (child instanceof SceneObjectBase) {
          callback(child);
        }
      }
    }
  }
}
