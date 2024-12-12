import { useState, useEffect } from 'react';
import { Subscription } from 'rxjs';
import { v4 } from 'uuid';
import { EventBusSrv } from '@grafana/data';
import { SceneComponentWrapper } from './SceneComponentWrapper.js';
import { SceneObjectStateChangedEvent } from './events.js';
import { cloneSceneObject } from './sceneGraph/utils.js';
import { SceneObjectRef } from './SceneObjectRef.js';

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
class SceneObjectBase {
  constructor(state) {
    this._isActive = false;
    this._activationHandlers = [];
    this._deactivationHandlers = /* @__PURE__ */ new Map();
    this._subs = new Subscription();
    this._refCount = 0;
    if (!state.key) {
      state.key = v4();
    }
    this._events = new EventBusSrv();
    this._state = Object.freeze(state);
    this._setParent(this._state);
  }
  get state() {
    return this._state;
  }
  get isActive() {
    return this._isActive;
  }
  get parent() {
    return this._parent;
  }
  get variableDependency() {
    return this._variableDependency;
  }
  get urlSync() {
    return this._urlSync;
  }
  get Component() {
    return SceneComponentWrapper;
  }
  _setParent(state) {
    forEachChild(state, (child) => {
      if (child._parent && child._parent !== this) {
        console.warn(
          "SceneObject already has a parent set that is different from the new parent. You cannot share the same SceneObject instance in multiple scenes or in multiple different places of the same scene graph. Use SceneObject.clone() to duplicate a SceneObject or store a state key reference and use sceneGraph.findObject to locate it.",
          child,
          this
        );
      }
      child._parent = this;
    });
  }
  clearParent() {
    this._parent = void 0;
  }
  subscribeToState(handler) {
    return this._events.subscribe(SceneObjectStateChangedEvent, (event) => {
      if (event.payload.changedObject === this) {
        handler(event.payload.newState, event.payload.prevState);
      }
    });
  }
  subscribeToEvent(eventType, handler) {
    return this._events.subscribe(eventType, handler);
  }
  setState(update) {
    const prevState = this._state;
    const newState = __spreadValues(__spreadValues({}, this._state), update);
    this._state = Object.freeze(newState);
    this._setParent(update);
    this._handleActivationOfChangedStateProps(prevState, newState);
    this.publishEvent(
      new SceneObjectStateChangedEvent({
        prevState,
        newState,
        partialUpdate: update,
        changedObject: this
      }),
      true
    );
  }
  _handleActivationOfChangedStateProps(prevState, newState) {
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
  _handleChangedStateActivation(oldValue, newValue) {
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
  _handleChangedBehaviors(oldValue, newValue) {
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
    if (newValue) {
      for (const newBehavior of newValue) {
        if (!oldValue || !oldValue.includes(newBehavior)) {
          this._activateBehavior(newBehavior);
        }
      }
    }
  }
  publishEvent(event, bubble) {
    this._events.publish(event);
    if (bubble && this.parent) {
      this.parent.publishEvent(event, bubble);
    }
  }
  getRoot() {
    return !this._parent ? this : this._parent.getRoot();
  }
  _internalActivate() {
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
  _activateBehavior(behavior) {
    if (behavior instanceof SceneObjectBase) {
      this._deactivationHandlers.set(behavior, behavior.activate());
    } else if (typeof behavior === "function") {
      const deactivate = behavior(this);
      if (deactivate) {
        this._deactivationHandlers.set(behavior, deactivate);
      }
    }
  }
  activate() {
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
  _internalDeactivate() {
    this._isActive = false;
    for (let handler of this._deactivationHandlers.values()) {
      handler();
    }
    this._deactivationHandlers.clear();
    this._events.removeAllListeners();
    this._subs.unsubscribe();
    this._subs = new Subscription();
  }
  useState() {
    return useSceneObjectState(this);
  }
  forceRender() {
    this.setState({});
  }
  clone(withState) {
    return cloneSceneObject(this, withState);
  }
  addActivationHandler(handler) {
    this._activationHandlers.push(handler);
  }
  forEachChild(callback) {
    forEachChild(this.state, callback);
  }
  getRef() {
    if (!this._ref) {
      this._ref = new SceneObjectRef(this);
    }
    return this._ref;
  }
}
function useSceneObjectState(model, options) {
  var _a;
  const [_, setState] = useState(model.state);
  const stateAtFirstRender = model.state;
  const shouldActivateOrKeepAlive = (_a = options == null ? void 0 : options.shouldActivateOrKeepAlive) != null ? _a : false;
  useEffect(() => {
    let unactivate;
    if (shouldActivateOrKeepAlive) {
      unactivate = model.activate();
    }
    const s = model.subscribeToState((state) => {
      setState(state);
    });
    if (model.state !== stateAtFirstRender) {
      setState(model.state);
    }
    return () => {
      s.unsubscribe();
      if (unactivate) {
        unactivate();
      }
    };
  }, [model, shouldActivateOrKeepAlive]);
  return model.state;
}
function forEachChild(state, callback) {
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

export { SceneObjectBase, useSceneObjectState };
//# sourceMappingURL=SceneObjectBase.js.map
