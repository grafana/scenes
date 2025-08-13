'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var reactRouterDom = require('react-router-dom');
var data = require('@grafana/data');
var runtime = require('@grafana/runtime');
var rxjs = require('rxjs');
var uuid = require('uuid');
var lodash = require('lodash');
var schema = require('@grafana/schema');
var ui = require('@grafana/ui');
var e2eSelectors = require('@grafana/e2e-selectors');
var css = require('@emotion/css');
var react = require('@floating-ui/react');
var reactVirtual = require('@tanstack/react-virtual');
var uFuzzy = require('@leeoniya/ufuzzy');
var reactUse = require('react-use');
var operators = require('rxjs/operators');
var ReactGridLayout = require('react-grid-layout');
var BarChartPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen');
var BarGaugePanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen');
var DatagridPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/datagrid/panelcfg/x/DatagridPanelCfg_types.gen');
var GaugePanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/gauge/panelcfg/x/GaugePanelCfg_types.gen');
var GeomapPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/geomap/panelcfg/x/GeomapPanelCfg_types.gen');
var HeatmapPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen');
var HistogramPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen');
var NewsPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/news/panelcfg/x/NewsPanelCfg_types.gen');
var PieChartPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen');
var StatPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen');
var StateTimelinePanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen');
var StatusHistoryPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen');
var TablePanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen');
var TextPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen');
var XYChartPanelCfg_types_gen = require('@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var uFuzzy__default = /*#__PURE__*/_interopDefaultLegacy(uFuzzy);
var ReactGridLayout__default = /*#__PURE__*/_interopDefaultLegacy(ReactGridLayout);

var __defProp$Q = Object.defineProperty;
var __getOwnPropSymbols$Q = Object.getOwnPropertySymbols;
var __hasOwnProp$Q = Object.prototype.hasOwnProperty;
var __propIsEnum$Q = Object.prototype.propertyIsEnumerable;
var __defNormalProp$Q = (obj, key, value) => key in obj ? __defProp$Q(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$Q = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$Q.call(b, prop))
      __defNormalProp$Q(a, prop, b[prop]);
  if (__getOwnPropSymbols$Q)
    for (var prop of __getOwnPropSymbols$Q(b)) {
      if (__propIsEnum$Q.call(b, prop))
        __defNormalProp$Q(a, prop, b[prop]);
    }
  return a;
};
function useAppQueryParams() {
  const location = reactRouterDom.useLocation();
  return runtime.locationSearchToObject(location.search || "");
}
function getUrlWithAppState(path, searchObject, preserveParams) {
  const paramsCopy = __spreadValues$Q({}, searchObject);
  if (preserveParams) {
    for (const key of Object.keys(paramsCopy)) {
      if (!preserveParams.includes(key)) {
        delete paramsCopy[key];
      }
    }
  }
  return data.urlUtil.renderUrl(data.locationUtil.assureBaseUrl(path), paramsCopy);
}
function renderSceneComponentWithRouteProps(sceneObject, routeProps) {
  return React__default["default"].createElement(sceneObject.Component, { model: sceneObject, routeProps });
}

var __defProp$P = Object.defineProperty;
var __defProps$x = Object.defineProperties;
var __getOwnPropDescs$x = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$P = Object.getOwnPropertySymbols;
var __hasOwnProp$P = Object.prototype.hasOwnProperty;
var __propIsEnum$P = Object.prototype.propertyIsEnumerable;
var __defNormalProp$P = (obj, key, value) => key in obj ? __defProp$P(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$P = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$P.call(b, prop))
      __defNormalProp$P(a, prop, b[prop]);
  if (__getOwnPropSymbols$P)
    for (var prop of __getOwnPropSymbols$P(b)) {
      if (__propIsEnum$P.call(b, prop))
        __defNormalProp$P(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$x = (a, b) => __defProps$x(a, __getOwnPropDescs$x(b));
const runtimePanelPlugins = /* @__PURE__ */ new Map();
function registerRuntimePanelPlugin({ pluginId, plugin }) {
  if (runtimePanelPlugins.has(pluginId)) {
    throw new Error(`A runtime panel plugin with id ${pluginId} has already been registered`);
  }
  plugin.meta = __spreadProps$x(__spreadValues$P({}, plugin.meta), {
    id: pluginId,
    name: pluginId,
    module: "runtime plugin",
    baseUrl: "runtime plugin",
    info: {
      author: {
        name: "Runtime plugin " + pluginId
      },
      description: "",
      links: [],
      logos: {
        large: "",
        small: ""
      },
      screenshots: [],
      updated: "",
      version: ""
    }
  });
  runtimePanelPlugins.set(pluginId, plugin);
}
function loadPanelPluginSync(pluginId) {
  var _a;
  const { getPanelPluginFromCache } = runtime.getPluginImportUtils();
  return (_a = getPanelPluginFromCache(pluginId)) != null ? _a : runtimePanelPlugins.get(pluginId);
}

var __defProp$O = Object.defineProperty;
var __defProps$w = Object.defineProperties;
var __getOwnPropDescs$w = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$O = Object.getOwnPropertySymbols;
var __hasOwnProp$O = Object.prototype.hasOwnProperty;
var __propIsEnum$O = Object.prototype.propertyIsEnumerable;
var __defNormalProp$O = (obj, key, value) => key in obj ? __defProp$O(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$O = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$O.call(b, prop))
      __defNormalProp$O(a, prop, b[prop]);
  if (__getOwnPropSymbols$O)
    for (var prop of __getOwnPropSymbols$O(b)) {
      if (__propIsEnum$O.call(b, prop))
        __defNormalProp$O(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$w = (a, b) => __defProps$w(a, __getOwnPropDescs$w(b));
var __objRest$5 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$O.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$O)
    for (var prop of __getOwnPropSymbols$O(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$O.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function SceneComponentWrapperWithoutMemo(_a) {
  var _b = _a, { model } = _b, otherProps = __objRest$5(_b, ["model"]);
  var _a2;
  const Component = (_a2 = model.constructor["Component"]) != null ? _a2 : EmptyRenderer;
  const [_, setValue] = React.useState(0);
  React.useEffect(() => {
    const unsub = model.activate();
    setValue((prevState) => prevState + 1);
    return unsub;
  }, [model]);
  if (!model.isActive && !model.renderBeforeActivation) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement(Component, __spreadProps$w(__spreadValues$O({}, otherProps), {
    model
  }));
}
const SceneComponentWrapper = React__default["default"].memo(SceneComponentWrapperWithoutMemo);
function EmptyRenderer(_) {
  return null;
}

class SceneObjectStateChangedEvent extends data.BusEventWithPayload {
}
SceneObjectStateChangedEvent.type = "scene-object-state-change";
class UserActionEvent extends data.BusEventWithPayload {
}
UserActionEvent.type = "scene-object-user-action";

var __accessCheck$3 = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet$3 = (obj, member, getter) => {
  __accessCheck$3(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$3 = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$2 = (obj, member, value, setter) => {
  __accessCheck$3(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _ref;
class SceneObjectRef {
  constructor(ref) {
    __privateAdd$3(this, _ref, void 0);
    __privateSet$2(this, _ref, ref);
  }
  resolve() {
    return __privateGet$3(this, _ref);
  }
}
_ref = new WeakMap();

var __defProp$N = Object.defineProperty;
var __getOwnPropSymbols$N = Object.getOwnPropertySymbols;
var __hasOwnProp$N = Object.prototype.hasOwnProperty;
var __propIsEnum$N = Object.prototype.propertyIsEnumerable;
var __defNormalProp$N = (obj, key, value) => key in obj ? __defProp$N(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$N = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$N.call(b, prop))
      __defNormalProp$N(a, prop, b[prop]);
  if (__getOwnPropSymbols$N)
    for (var prop of __getOwnPropSymbols$N(b)) {
      if (__propIsEnum$N.call(b, prop))
        __defNormalProp$N(a, prop, b[prop]);
    }
  return a;
};
class SceneObjectBase {
  constructor(state) {
    this._isActive = false;
    this._activationHandlers = [];
    this._deactivationHandlers = /* @__PURE__ */ new Map();
    this._subs = new rxjs.Subscription();
    this._refCount = 0;
    this._renderBeforeActivation = false;
    if (!state.key) {
      state.key = uuid.v4();
    }
    this._events = new data.EventBusSrv();
    this._state = Object.freeze(state);
    this._setParent(this._state);
  }
  get state() {
    return this._state;
  }
  get isActive() {
    return this._isActive;
  }
  get renderBeforeActivation() {
    return this._renderBeforeActivation;
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
    const newState = __spreadValues$N(__spreadValues$N({}, this._state), update);
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
    this._subs = new rxjs.Subscription();
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
  const [_, setState] = React.useState(model.state);
  const stateAtFirstRender = model.state;
  const shouldActivateOrKeepAlive = (_a = options == null ? void 0 : options.shouldActivateOrKeepAlive) != null ? _a : false;
  React.useEffect(() => {
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

var __defProp$M = Object.defineProperty;
var __getOwnPropSymbols$M = Object.getOwnPropertySymbols;
var __hasOwnProp$M = Object.prototype.hasOwnProperty;
var __propIsEnum$M = Object.prototype.propertyIsEnumerable;
var __defNormalProp$M = (obj, key, value) => key in obj ? __defProp$M(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$M = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$M.call(b, prop))
      __defNormalProp$M(a, prop, b[prop]);
  if (__getOwnPropSymbols$M)
    for (var prop of __getOwnPropSymbols$M(b)) {
      if (__propIsEnum$M.call(b, prop))
        __defNormalProp$M(a, prop, b[prop]);
    }
  return a;
};
function cloneSceneObject(sceneObject, withState) {
  const clonedState = cloneSceneObjectState(sceneObject.state, withState);
  return new sceneObject.constructor(clonedState);
}
function cloneSceneObjectState(sceneState, withState) {
  const clonedState = __spreadValues$M({}, sceneState);
  Object.assign(clonedState, withState);
  for (const key in clonedState) {
    if (withState && withState[key] !== void 0) {
      continue;
    }
    const propValue = clonedState[key];
    if (propValue instanceof SceneObjectBase) {
      clonedState[key] = propValue.clone();
    }
    if (propValue instanceof SceneObjectRef) {
      console.warn("Cloning object with SceneObjectRef");
      continue;
    }
    if (Array.isArray(propValue)) {
      const newArray = [];
      for (const child of propValue) {
        if (child instanceof SceneObjectBase) {
          newArray.push(child.clone());
        } else {
          newArray.push(child);
        }
      }
      clonedState[key] = newArray;
    }
  }
  return clonedState;
}
function getClosest(sceneObject, extract) {
  let curSceneObject = sceneObject;
  let extracted = void 0;
  while (curSceneObject && !extracted) {
    extracted = extract(curSceneObject);
    curSceneObject = curSceneObject.parent;
  }
  return extracted;
}

class RuntimeDataSource extends data.DataSourceApi {
  constructor(pluginId, uid) {
    super({
      name: "RuntimeDataSource-" + pluginId,
      uid,
      type: pluginId,
      id: 1,
      readOnly: true,
      jsonData: {},
      access: "direct",
      meta: {
        id: pluginId,
        name: "RuntimeDataSource-" + pluginId,
        type: data.PluginType.datasource,
        info: {
          author: {
            name: ""
          },
          description: "",
          links: [],
          logos: {
            large: "",
            small: ""
          },
          screenshots: [],
          updated: "",
          version: ""
        },
        module: "",
        baseUrl: ""
      }
    });
  }
  testDatasource() {
    return Promise.resolve({});
  }
}
const runtimeDataSources = /* @__PURE__ */ new Map();
function registerRuntimeDataSource({ dataSource }) {
  if (runtimeDataSources.has(dataSource.uid)) {
    throw new Error(`A runtime data source with uid ${dataSource.uid} has already been registered`);
  }
  runtimeDataSources.set(dataSource.uid, dataSource);
}

function lookupVariable(name, sceneObject) {
  const variables = sceneObject.state.$variables;
  if (!variables) {
    if (sceneObject.parent) {
      return lookupVariable(name, sceneObject.parent);
    } else {
      return null;
    }
  }
  const found = variables.getByName(name);
  if (found) {
    return found;
  } else if (sceneObject.parent) {
    return lookupVariable(name, sceneObject.parent);
  }
  return null;
}

var __defProp$L = Object.defineProperty;
var __getOwnPropSymbols$L = Object.getOwnPropertySymbols;
var __hasOwnProp$L = Object.prototype.hasOwnProperty;
var __propIsEnum$L = Object.prototype.propertyIsEnumerable;
var __defNormalProp$L = (obj, key, value) => key in obj ? __defProp$L(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$L = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$L.call(b, prop))
      __defNormalProp$L(a, prop, b[prop]);
  if (__getOwnPropSymbols$L)
    for (var prop of __getOwnPropSymbols$L(b)) {
      if (__propIsEnum$L.call(b, prop))
        __defNormalProp$L(a, prop, b[prop]);
    }
  return a;
};
class SceneDataNode extends SceneObjectBase {
  constructor(state) {
    super(__spreadValues$L({
      data: emptyPanelData
    }, state));
  }
  getResultsStream() {
    const result = {
      origin: this,
      data: this.state.data
    };
    return rxjs.of(result);
  }
}
const emptyPanelData = {
  state: schema.LoadingState.Done,
  series: [],
  timeRange: data.getDefaultTimeRange()
};

class SceneObjectUrlSyncConfig {
  constructor(_sceneObject, _options) {
    this._sceneObject = _sceneObject;
    this._nextChangeShouldAddHistoryStep = false;
    this._keys = _options.keys;
  }
  getKeys() {
    if (typeof this._keys === "function") {
      return this._keys();
    }
    return this._keys;
  }
  getUrlState() {
    return this._sceneObject.getUrlState();
  }
  updateFromUrl(values) {
    this._sceneObject.updateFromUrl(values);
  }
  performBrowserHistoryAction(callback) {
    this._nextChangeShouldAddHistoryStep = true;
    callback();
    this._nextChangeShouldAddHistoryStep = false;
  }
  shouldCreateHistoryStep(values) {
    return this._nextChangeShouldAddHistoryStep;
  }
}

const INTERVAL_STRING_REGEX = /^\d+[yYmMsSwWhHdD]$/;
function parseUrlParam(value) {
  if (typeof value !== "string") {
    return null;
  }
  if (value.indexOf("now") !== -1) {
    return value;
  }
  if (INTERVAL_STRING_REGEX.test(value)) {
    return value;
  }
  if (value.length === 8) {
    const utcValue = data.toUtc(value, "YYYYMMDD");
    if (utcValue.isValid()) {
      return utcValue.toISOString();
    }
  } else if (value.length === 15) {
    const utcValue = data.toUtc(value, "YYYYMMDDTHHmmss");
    if (utcValue.isValid()) {
      return utcValue.toISOString();
    }
  } else if (value.length === 19) {
    const utcValue = data.toUtc(value, "YYYY-MM-DD HH:mm:ss");
    if (utcValue.isValid()) {
      return utcValue.toISOString();
    }
  } else if (value.length === 24) {
    const utcValue = data.toUtc(value);
    return utcValue.toISOString();
  }
  const epoch = parseInt(value, 10);
  if (!isNaN(epoch)) {
    return data.toUtc(epoch).toISOString();
  }
  return null;
}

function evaluateTimeRange(from, to, timeZone, fiscalYearStartMonth, delay, weekStart) {
  const hasDelay = delay && to === "now";
  const now = Date.now();
  if (weekStart) {
    setWeekStartIfDifferent(weekStart);
  }
  const parseOrToDateTime = (val, options) => {
    if (data.dateMath.toDateTime) {
      return data.dateMath.toDateTime(val, options);
    } else {
      return data.dateMath.parse(val, options.roundUp, options.timezone, options.fiscalYearStartMonth);
    }
  };
  return {
    to: parseOrToDateTime(hasDelay ? "now-" + delay : to, {
      roundUp: true,
      timezone: timeZone,
      fiscalYearStartMonth,
      now
    }),
    from: parseOrToDateTime(from, {
      roundUp: false,
      timezone: timeZone,
      fiscalYearStartMonth,
      now
    }),
    raw: {
      from,
      to
    }
  };
}
let prevWeekStart;
function setWeekStartIfDifferent(weekStart) {
  if (weekStart !== prevWeekStart) {
    prevWeekStart = weekStart;
    data.setWeekStart(weekStart);
  }
}

function isValid$1(value, roundUp, timeZone) {
  if (data.isDateTime(value)) {
    return value.isValid();
  }
  if (data.dateMath.isMathString(value)) {
    return data.dateMath.isValid(value);
  }
  const parsed = data.dateTimeParse(value, { roundUp, timeZone });
  return parsed.isValid();
}

var __defProp$K = Object.defineProperty;
var __getOwnPropSymbols$K = Object.getOwnPropertySymbols;
var __hasOwnProp$K = Object.prototype.hasOwnProperty;
var __propIsEnum$K = Object.prototype.propertyIsEnumerable;
var __defNormalProp$K = (obj, key, value) => key in obj ? __defProp$K(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$K = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$K.call(b, prop))
      __defNormalProp$K(a, prop, b[prop]);
  if (__getOwnPropSymbols$K)
    for (var prop of __getOwnPropSymbols$K(b)) {
      if (__propIsEnum$K.call(b, prop))
        __defNormalProp$K(a, prop, b[prop]);
    }
  return a;
};
class SceneTimeRange extends SceneObjectBase {
  constructor(state = {}) {
    var _a;
    const from = state.from && isValid$1(state.from) ? state.from : "now-6h";
    const to = state.to && isValid$1(state.to) ? state.to : "now";
    const timeZone = state.timeZone;
    const value = evaluateTimeRange(
      from,
      to,
      timeZone || data.getTimeZone(),
      state.fiscalYearStartMonth,
      state.UNSAFE_nowDelay,
      state.weekStart
    );
    const refreshOnActivate = (_a = state.refreshOnActivate) != null ? _a : { percent: 10 };
    super(__spreadValues$K({ from, to, timeZone, value, refreshOnActivate }, state));
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: ["from", "to", "timezone", "time", "time.window"] });
    this.onTimeRangeChange = (timeRange) => {
      const update = {};
      if (typeof timeRange.raw.from === "string") {
        update.from = timeRange.raw.from;
      } else {
        update.from = timeRange.raw.from.toISOString();
      }
      if (typeof timeRange.raw.to === "string") {
        update.to = timeRange.raw.to;
      } else {
        update.to = timeRange.raw.to.toISOString();
      }
      update.value = evaluateTimeRange(
        update.from,
        update.to,
        this.getTimeZone(),
        this.state.fiscalYearStartMonth,
        this.state.UNSAFE_nowDelay,
        this.state.weekStart
      );
      if (update.from !== this.state.from || update.to !== this.state.to) {
        this._urlSync.performBrowserHistoryAction(() => {
          this.setState(update);
        });
      }
    };
    this.onTimeZoneChange = (timeZone) => {
      this._urlSync.performBrowserHistoryAction(() => {
        this.setState({ timeZone });
      });
    };
    this.onRefresh = () => {
      this.refreshRange(0);
      this.publishEvent(new runtime.RefreshEvent(), true);
    };
    this.addActivationHandler(this._onActivate.bind(this));
  }
  _onActivate() {
    if (!this.state.timeZone) {
      const timeZoneSource = this.getTimeZoneSource();
      if (timeZoneSource !== this) {
        this._subs.add(
          timeZoneSource.subscribeToState((n, p) => {
            if (n.timeZone !== void 0 && n.timeZone !== p.timeZone) {
              this.refreshRange(0);
            }
          })
        );
      }
    }
    if (data.rangeUtil.isRelativeTimeRange(this.state.value.raw)) {
      this.refreshIfStale();
    }
    return () => {
      if (this.state.weekStart) {
        data.setWeekStart(runtime.config.bootData.user.weekStart);
      }
    };
  }
  refreshIfStale() {
    var _a, _b, _c, _d;
    let ms;
    if (((_b = (_a = this.state) == null ? void 0 : _a.refreshOnActivate) == null ? void 0 : _b.percent) !== void 0) {
      ms = this.calculatePercentOfInterval(this.state.refreshOnActivate.percent);
    }
    if (((_d = (_c = this.state) == null ? void 0 : _c.refreshOnActivate) == null ? void 0 : _d.afterMs) !== void 0) {
      ms = Math.min(this.state.refreshOnActivate.afterMs, ms != null ? ms : Infinity);
    }
    if (ms !== void 0) {
      this.refreshRange(ms);
    }
  }
  getTimeZoneSource() {
    if (!this.parent || !this.parent.parent) {
      return this;
    }
    const source = getClosest(this.parent.parent, (o) => {
      if (o.state.$timeRange && o.state.$timeRange.state.timeZone) {
        return o.state.$timeRange;
      }
      return void 0;
    });
    if (!source) {
      return this;
    }
    return source;
  }
  refreshRange(refreshAfterMs) {
    var _a;
    const value = evaluateTimeRange(
      this.state.from,
      this.state.to,
      (_a = this.state.timeZone) != null ? _a : data.getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay,
      this.state.weekStart
    );
    const diff = value.to.diff(this.state.value.to, "milliseconds");
    if (diff >= refreshAfterMs) {
      this.setState({ value });
    }
  }
  calculatePercentOfInterval(percent) {
    const intervalMs = this.state.value.to.diff(this.state.value.from, "milliseconds");
    return Math.ceil(intervalMs / percent);
  }
  getTimeZone() {
    if (this.state.timeZone) {
      return this.state.timeZone;
    }
    const timeZoneSource = this.getTimeZoneSource();
    if (timeZoneSource !== this) {
      return timeZoneSource.state.timeZone;
    }
    return data.getTimeZone();
  }
  getUrlState() {
    const params = runtime.locationService.getSearchObject();
    const urlValues = { from: this.state.from, to: this.state.to, timezone: this.getTimeZone() };
    if (params.time && params["time.window"]) {
      urlValues.time = null;
      urlValues["time.window"] = null;
    }
    return urlValues;
  }
  updateFromUrl(values) {
    var _a, _b, _c;
    const update = {};
    let from = parseUrlParam(values.from);
    let to = parseUrlParam(values.to);
    if (values.time && values["time.window"]) {
      const time = Array.isArray(values.time) ? values.time[0] : values.time;
      const timeWindow = Array.isArray(values["time.window"]) ? values["time.window"][0] : values["time.window"];
      const timeRange = getTimeWindow(time, timeWindow);
      if (timeRange.from && isValid$1(timeRange.from)) {
        from = timeRange.from;
      }
      if (timeRange.to && isValid$1(timeRange.to)) {
        to = timeRange.to;
      }
    }
    if (from && isValid$1(from)) {
      update.from = from;
    }
    if (to && isValid$1(to)) {
      update.to = to;
    }
    if (typeof values.timezone === "string") {
      update.timeZone = values.timezone !== "" ? values.timezone : void 0;
    }
    if (Object.keys(update).length === 0) {
      return;
    }
    update.value = evaluateTimeRange(
      (_a = update.from) != null ? _a : this.state.from,
      (_b = update.to) != null ? _b : this.state.to,
      (_c = update.timeZone) != null ? _c : this.getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay,
      this.state.weekStart
    );
    return this.setState(update);
  }
}
function getTimeWindow(time, timeWindow) {
  const valueTime = isNaN(Date.parse(time)) ? parseInt(time, 10) : Date.parse(time);
  let timeWindowMs;
  if (timeWindow.match(/^\d+$/) && parseInt(timeWindow, 10)) {
    timeWindowMs = parseInt(timeWindow, 10);
  } else {
    timeWindowMs = data.rangeUtil.intervalToMs(timeWindow);
  }
  return {
    from: data.toUtc(valueTime - timeWindowMs / 2).toISOString(),
    to: data.toUtc(valueTime + timeWindowMs / 2).toISOString()
  };
}

const EmptyDataNode = new SceneDataNode();
const DefaultTimeRange = new SceneTimeRange();
class EmptyVariableSetImpl extends SceneObjectBase {
  constructor() {
    super({ variables: [] });
  }
  getByName(name) {
    return void 0;
  }
  isVariableLoadingOrWaitingToUpdate(variable) {
    return false;
  }
}
const EmptyVariableSet = new EmptyVariableSetImpl();

function getTimeRange(sceneObject) {
  var _a;
  return (_a = getClosest(sceneObject, (s) => s.state.$timeRange)) != null ? _a : DefaultTimeRange;
}

class SceneVariableValueChangedEvent extends data.BusEventWithPayload {
}
SceneVariableValueChangedEvent.type = "scene-variable-changed-value";
function isCustomVariableValue(value) {
  return typeof value === "object" && "formatter" in value;
}

let fieldAccessorCache = {};
function getFieldAccessor(fieldPath) {
  const accessor = fieldAccessorCache[fieldPath];
  if (accessor) {
    return accessor;
  }
  return fieldAccessorCache[fieldPath] = lodash.property(fieldPath);
}

class ScopedVarsVariable {
  constructor(name, value) {
    this.state = { name, value, type: "scopedvar" };
  }
  getValue(fieldPath) {
    let { value } = this.state;
    let realValue = value.value;
    if (fieldPath) {
      realValue = getFieldAccessor(fieldPath)(value.value);
    } else {
      realValue = value.value;
    }
    if (realValue === "string" || realValue === "number" || realValue === "boolean") {
      return realValue;
    }
    return String(realValue);
  }
  getValueText() {
    const { value } = this.state;
    if (value.text != null) {
      return String(value.text);
    }
    return String(value);
  }
}
let scopedVarsVariable;
function getSceneVariableForScopedVar(name, value) {
  if (!scopedVarsVariable) {
    scopedVarsVariable = new ScopedVarsVariable(name, value);
  } else {
    scopedVarsVariable.state.name = name;
    scopedVarsVariable.state.value = value;
  }
  return scopedVarsVariable;
}

const ALL_VARIABLE_TEXT = "All";
const ALL_VARIABLE_VALUE = "$__all";
const AUTO_VARIABLE_TEXT = "Auto";
const AUTO_VARIABLE_VALUE = "$__auto";
const VARIABLE_REGEX = /\$(\w+)|\[\[(\w+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/g;
const SEARCH_FILTER_VARIABLE = "__searchFilter";

const formatRegistry = new data.Registry(() => {
  const formats = [
    {
      id: schema.VariableFormatID.Lucene,
      name: "Lucene",
      description: "Values are lucene escaped and multi-valued variables generate an OR expression",
      formatter: (value) => {
        if (typeof value === "string") {
          return luceneEscape(value);
        }
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return "__empty__";
          }
          const quotedValues = lodash.map(value, (val) => {
            return '"' + luceneEscape(val) + '"';
          });
          return "(" + quotedValues.join(" OR ") + ")";
        } else {
          return luceneEscape(`${value}`);
        }
      }
    },
    {
      id: schema.VariableFormatID.Raw,
      name: "raw",
      description: "Keep value as is",
      formatter: (value) => String(value)
    },
    {
      id: schema.VariableFormatID.Regex,
      name: "Regex",
      description: "Values are regex escaped and multi-valued variables generate a (<value>|<value>) expression",
      formatter: (value) => {
        if (typeof value === "string") {
          return data.escapeRegex(value);
        }
        if (Array.isArray(value)) {
          const escapedValues = value.map((item) => {
            if (typeof item === "string") {
              return data.escapeRegex(item);
            } else {
              return data.escapeRegex(String(item));
            }
          });
          if (escapedValues.length === 1) {
            return escapedValues[0];
          }
          return "(" + escapedValues.join("|") + ")";
        }
        return data.escapeRegex(`${value}`);
      }
    },
    {
      id: schema.VariableFormatID.Pipe,
      name: "Pipe",
      description: "Values are separated by | character",
      formatter: (value) => {
        if (typeof value === "string") {
          return value;
        }
        if (Array.isArray(value)) {
          return value.join("|");
        }
        return `${value}`;
      }
    },
    {
      id: schema.VariableFormatID.Distributed,
      name: "Distributed",
      description: "Multiple values are formatted like variable=value",
      formatter: (value, args, variable) => {
        if (typeof value === "string") {
          return value;
        }
        if (Array.isArray(value)) {
          value = lodash.map(value, (val, index) => {
            if (index !== 0) {
              return variable.state.name + "=" + val;
            } else {
              return val;
            }
          });
          return value.join(",");
        }
        return `${value}`;
      }
    },
    {
      id: schema.VariableFormatID.CSV,
      name: "Csv",
      description: "Comma-separated values",
      formatter: (value) => {
        if (typeof value === "string") {
          return value;
        }
        if (lodash.isArray(value)) {
          return value.join(",");
        }
        return String(value);
      }
    },
    {
      id: schema.VariableFormatID.HTML,
      name: "HTML",
      description: "HTML escaping of values",
      formatter: (value) => {
        if (typeof value === "string") {
          return data.textUtil.escapeHtml(value);
        }
        if (lodash.isArray(value)) {
          return data.textUtil.escapeHtml(value.join(", "));
        }
        return data.textUtil.escapeHtml(String(value));
      }
    },
    {
      id: schema.VariableFormatID.JSON,
      name: "JSON",
      description: "JSON stringify value",
      formatter: (value) => {
        if (typeof value === "string") {
          return value;
        }
        return JSON.stringify(value);
      }
    },
    {
      id: schema.VariableFormatID.PercentEncode,
      name: "Percent encode",
      description: "Useful for URL escaping values",
      formatter: (value) => {
        if (lodash.isArray(value)) {
          return encodeURIComponentStrict("{" + value.join(",") + "}");
        }
        return encodeURIComponentStrict(value);
      }
    },
    {
      id: schema.VariableFormatID.SingleQuote,
      name: "Single quote",
      description: "Single quoted values",
      formatter: (value) => {
        const regExp = new RegExp(`'`, "g");
        if (lodash.isArray(value)) {
          return lodash.map(value, (v) => `'${lodash.replace(v, regExp, `\\'`)}'`).join(",");
        }
        let strVal = typeof value === "string" ? value : String(value);
        return `'${lodash.replace(strVal, regExp, `\\'`)}'`;
      }
    },
    {
      id: schema.VariableFormatID.DoubleQuote,
      name: "Double quote",
      description: "Double quoted values",
      formatter: (value) => {
        const regExp = new RegExp('"', "g");
        if (lodash.isArray(value)) {
          return lodash.map(value, (v) => `"${lodash.replace(v, regExp, '\\"')}"`).join(",");
        }
        let strVal = typeof value === "string" ? value : String(value);
        return `"${lodash.replace(strVal, regExp, '\\"')}"`;
      }
    },
    {
      id: schema.VariableFormatID.SQLString,
      name: "SQL string",
      description: "SQL string quoting and commas for use in IN statements and other scenarios",
      formatter: sqlStringFormatter
    },
    {
      id: schema.VariableFormatID.Date,
      name: "Date",
      description: "Format date in different ways",
      formatter: (value, args) => {
        var _a;
        let nrValue = NaN;
        if (typeof value === "number") {
          nrValue = value;
        } else if (typeof value === "string") {
          nrValue = parseInt(value, 10);
        }
        if (isNaN(nrValue)) {
          return "NaN";
        }
        const arg = (_a = args[0]) != null ? _a : "iso";
        switch (arg) {
          case "ms":
            return String(value);
          case "seconds":
            return `${Math.round(nrValue / 1e3)}`;
          case "iso":
            return data.dateTime(nrValue).toISOString();
          default:
            if ((args || []).length > 1) {
              return data.dateTime(nrValue).format(args.join(":"));
            }
            return data.dateTime(nrValue).format(arg);
        }
      }
    },
    {
      id: schema.VariableFormatID.Glob,
      name: "Glob",
      description: "Format multi-valued variables using glob syntax, example {value1,value2}",
      formatter: (value) => {
        if (lodash.isArray(value) && value.length > 1) {
          return "{" + value.join(",") + "}";
        }
        return String(value);
      }
    },
    {
      id: schema.VariableFormatID.Text,
      name: "Text",
      description: "Format variables in their text representation. Example in multi-variable scenario A + B + C.",
      formatter: (value, _args, variable) => {
        if (variable.getValueText) {
          return variable.getValueText();
        }
        return String(value);
      }
    },
    {
      id: schema.VariableFormatID.QueryParam,
      name: "Query parameter",
      description: "Format variables as URL parameters. Example in multi-variable scenario A + B + C => var-foo=A&var-foo=B&var-foo=C.",
      formatter: (value, _args, variable) => {
        if (variable.urlSync) {
          const urlParam = variable.urlSync.getUrlState();
          return data.urlUtil.toUrlParams(urlParam);
        }
        if (Array.isArray(value)) {
          return value.map((v) => formatQueryParameter(variable.state.name, v)).join("&");
        }
        return formatQueryParameter(variable.state.name, value);
      }
    },
    {
      id: schema.VariableFormatID.UriEncode,
      name: "Percent encode as URI",
      description: "Useful for URL escaping values, taking into URI syntax characters",
      formatter: (value) => {
        if (lodash.isArray(value)) {
          return encodeURIStrict("{" + value.join(",") + "}");
        }
        return encodeURIStrict(value);
      }
    }
  ];
  return formats;
});
function luceneEscape(value) {
  if (isNaN(+value) === false) {
    return value;
  }
  return value.replace(/([\!\*\+\-\=<>\s\&\|\(\)\[\]\{\}\^\~\?\:\\/"])/g, "\\$1");
}
function encodeURIComponentStrict(str) {
  if (typeof str === "object") {
    str = String(str);
  }
  return replaceSpecialCharactersToASCII(encodeURIComponent(str));
}
const encodeURIStrict = (str) => replaceSpecialCharactersToASCII(encodeURI(String(str)));
const replaceSpecialCharactersToASCII = (value) => value.replace(/[!'()*]/g, (c) => {
  return "%" + c.charCodeAt(0).toString(16).toUpperCase();
});
function formatQueryParameter(name, value) {
  return `var-${name}=${encodeURIComponentStrict(value)}`;
}
const SQL_ESCAPE_MAP = {
  "'": "''",
  '"': '\\"'
};
function sqlStringFormatter(value) {
  const regExp = new RegExp(`'|"`, "g");
  if (lodash.isArray(value)) {
    return lodash.map(value, (v) => `'${lodash.replace(v, regExp, (match) => {
      var _a;
      return (_a = SQL_ESCAPE_MAP[match]) != null ? _a : "";
    })}'`).join(",");
  }
  let strVal = typeof value === "string" ? value : String(value);
  return `'${lodash.replace(strVal, regExp, (match) => {
    var _a;
    return (_a = SQL_ESCAPE_MAP[match]) != null ? _a : "";
  })}'`;
}

class SkipFormattingValue {
  constructor(_value) {
    this._value = _value;
  }
  formatter() {
    return this._value;
  }
}

class UrlTimeRangeMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "url_variable" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    var _a;
    const timeRange = getTimeRange(this._sceneObject);
    const urlState = (_a = timeRange.urlSync) == null ? void 0 : _a.getUrlState();
    if ((urlState == null ? void 0 : urlState.timezone) === "browser") {
      urlState.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return new SkipFormattingValue(data.urlUtil.toUrlParams(urlState));
  }
  getValueText() {
    return "";
  }
}
class TimeFromAndToMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "time_macro" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    const timeRange = getTimeRange(this._sceneObject);
    if (this.state.name === "__from") {
      return timeRange.state.value.from.valueOf();
    } else {
      return timeRange.state.value.to.valueOf();
    }
  }
  getValueText() {
    const timeRange = getTimeRange(this._sceneObject);
    if (this.state.name === "__from") {
      return data.dateTimeFormat(timeRange.state.value.from, { timeZone: timeRange.getTimeZone() });
    } else {
      return data.dateTimeFormat(timeRange.state.value.to, { timeZone: timeRange.getTimeZone() });
    }
  }
}
class TimezoneMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "time_macro" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    const timeRange = getTimeRange(this._sceneObject);
    const timeZone = timeRange.getTimeZone();
    if (timeZone === "browser") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return timeZone;
  }
  getValueText() {
    return this.getValue();
  }
}
class IntervalMacro {
  constructor(name, sceneObject, match) {
    this.state = { name, type: "time_macro", match };
    this._sceneObject = sceneObject;
  }
  getValue() {
    var _a;
    const data = getData(this._sceneObject);
    if (data) {
      const request = (_a = data.state.data) == null ? void 0 : _a.request;
      if (!request) {
        return this.state.match;
      }
      if (this.state.name === "__interval_ms") {
        return request.intervalMs;
      }
      return request.interval;
    }
    return this.state.match;
  }
}

function setBaseClassState(sceneObject, newState) {
  sceneObject.setState(newState);
}
function useLocationServiceSafe() {
  return runtime.useLocationService ? runtime.useLocationService() : runtime.locationService;
}

class MultiValueVariable extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this._urlSync = new MultiValueUrlSyncHandler(this);
  }
  validateAndUpdate() {
    return this.getValueOptions({}).pipe(
      rxjs.map((options) => {
        this.updateValueGivenNewOptions(options);
        return {};
      })
    );
  }
  onCancel() {
    this.setStateHelper({ loading: false });
    const sceneVarSet = this.parent;
    sceneVarSet == null ? void 0 : sceneVarSet.cancel(this);
  }
  updateValueGivenNewOptions(options) {
    const { value: currentValue, text: currentText, options: oldOptions } = this.state;
    const stateUpdate = this.getStateUpdateGivenNewOptions(options, currentValue, currentText);
    this.interceptStateUpdateAfterValidation(stateUpdate);
    this.setStateHelper(stateUpdate);
    if (stateUpdate.value !== currentValue || stateUpdate.text !== currentText || this.hasAllValue() && !lodash.isEqual(options, oldOptions)) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
  getStateUpdateGivenNewOptions(options, currentValue, currentText) {
    const stateUpdate = {
      options,
      loading: false,
      value: currentValue,
      text: currentText
    };
    if (options.length === 0) {
      if (this.state.defaultToAll || this.state.includeAll) {
        stateUpdate.value = ALL_VARIABLE_VALUE;
        stateUpdate.text = ALL_VARIABLE_TEXT;
      } else if (this.state.isMulti) {
        stateUpdate.value = [];
        stateUpdate.text = [];
      } else {
        stateUpdate.value = "";
        stateUpdate.text = "";
      }
      return stateUpdate;
    }
    if (this.hasAllValue()) {
      if (this.state.includeAll) {
        stateUpdate.text = ALL_VARIABLE_TEXT;
      } else {
        stateUpdate.value = options[0].value;
        stateUpdate.text = options[0].label;
        if (this.state.isMulti) {
          stateUpdate.value = [stateUpdate.value];
          stateUpdate.text = [stateUpdate.text];
        }
      }
      return stateUpdate;
    }
    if (this.state.isMulti) {
      const currentValues = Array.isArray(currentValue) ? currentValue : [currentValue];
      const validValues = currentValues.filter((v) => options.find((o) => o.value === v));
      const validTexts = validValues.map((v) => options.find((o) => o.value === v).label);
      if (validValues.length === 0) {
        const defaultState = this.getDefaultMultiState(options);
        stateUpdate.value = defaultState.value;
        stateUpdate.text = defaultState.text;
      } else {
        if (!lodash.isEqual(validValues, currentValue)) {
          stateUpdate.value = validValues;
        }
        if (!lodash.isEqual(validTexts, currentText)) {
          stateUpdate.text = validTexts;
        }
      }
      return stateUpdate;
    }
    let matchingOption = findOptionMatchingCurrent(currentValue, currentText, options);
    if (matchingOption) {
      stateUpdate.text = matchingOption.label;
      stateUpdate.value = matchingOption.value;
    } else {
      if (this.state.defaultToAll) {
        stateUpdate.value = ALL_VARIABLE_VALUE;
        stateUpdate.text = ALL_VARIABLE_TEXT;
      } else {
        stateUpdate.value = options[0].value;
        stateUpdate.text = options[0].label;
      }
    }
    return stateUpdate;
  }
  interceptStateUpdateAfterValidation(stateUpdate) {
    const isAllValueFix = stateUpdate.value === ALL_VARIABLE_VALUE && this.state.text === ALL_VARIABLE_TEXT;
    if (this.skipNextValidation && stateUpdate.value !== this.state.value && stateUpdate.text !== this.state.text && !isAllValueFix) {
      stateUpdate.value = this.state.value;
      stateUpdate.text = this.state.text;
    }
    this.skipNextValidation = false;
  }
  getValue() {
    if (this.hasAllValue()) {
      if (this.state.allValue) {
        return new CustomAllValue(this.state.allValue, this);
      }
      return new CustomAllValue(".*", this);
    }
    return this.state.value;
  }
  getValueText() {
    if (this.hasAllValue()) {
      return ALL_VARIABLE_TEXT;
    }
    if (Array.isArray(this.state.text)) {
      return this.state.text.join(" + ");
    }
    return String(this.state.text);
  }
  hasAllValue() {
    const value = this.state.value;
    return value === ALL_VARIABLE_VALUE || Array.isArray(value) && value[0] === ALL_VARIABLE_VALUE;
  }
  getDefaultMultiState(options) {
    if (this.state.defaultToAll) {
      return { value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] };
    } else if (options.length > 0) {
      return { value: [options[0].value], text: [options[0].label] };
    } else {
      return { value: [], text: [] };
    }
  }
  changeValueTo(value, text) {
    if (value === this.state.value && text === this.state.text) {
      return;
    }
    if (!text) {
      if (Array.isArray(value)) {
        text = value.map((v) => this.findLabelTextForValue(v));
      } else {
        text = this.findLabelTextForValue(value);
      }
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        const state = this.getDefaultMultiState(this.state.options);
        value = state.value;
        text = state.text;
      }
      if (value[value.length - 1] === ALL_VARIABLE_VALUE) {
        value = [ALL_VARIABLE_VALUE];
        text = [ALL_VARIABLE_TEXT];
      } else if (value[0] === ALL_VARIABLE_VALUE && value.length > 1) {
        value.shift();
        if (Array.isArray(text)) {
          text.shift();
        }
      }
    }
    if (lodash.isEqual(value, this.state.value) && lodash.isEqual(text, this.state.text)) {
      return;
    }
    this.setStateHelper({ value, text, loading: false });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  }
  findLabelTextForValue(value) {
    if (value === ALL_VARIABLE_VALUE) {
      return ALL_VARIABLE_TEXT;
    }
    const option = this.state.options.find((x) => x.value === value);
    if (option) {
      return option.label;
    }
    const optionByLabel = this.state.options.find((x) => x.label === value);
    if (optionByLabel) {
      return optionByLabel.label;
    }
    return value;
  }
  setStateHelper(state) {
    setBaseClassState(this, state);
  }
  getOptionsForSelect() {
    let options = this.state.options;
    if (this.state.includeAll) {
      options = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...options];
    }
    if (!Array.isArray(this.state.value)) {
      const current = options.find((x) => x.value === this.state.value);
      if (!current) {
        options = [{ value: this.state.value, label: String(this.state.text) }, ...options];
      }
    }
    return options;
  }
  refreshOptions() {
    this.getValueOptions({}).subscribe((options) => {
      this.updateValueGivenNewOptions(options);
    });
  }
}
function findOptionMatchingCurrent(currentValue, currentText, options) {
  let textMatch;
  for (const item of options) {
    if (item.value === currentValue) {
      return item;
    }
    if (item.label === currentText) {
      textMatch = item;
    }
  }
  return textMatch;
}
class MultiValueUrlSyncHandler {
  constructor(_sceneObject) {
    this._sceneObject = _sceneObject;
  }
  getKey() {
    return `var-${this._sceneObject.state.name}`;
  }
  getKeys() {
    if (this._sceneObject.state.skipUrlSync) {
      return [];
    }
    return [this.getKey()];
  }
  getUrlState() {
    if (this._sceneObject.state.skipUrlSync) {
      return {};
    }
    let urlValue = null;
    let value = this._sceneObject.state.value;
    if (Array.isArray(value)) {
      urlValue = value.map(String);
    } else if (this._sceneObject.state.isMulti) {
      urlValue = [String(value)];
    } else {
      urlValue = String(value);
    }
    return { [this.getKey()]: urlValue };
  }
  updateFromUrl(values) {
    let urlValue = values[this.getKey()];
    if (urlValue != null) {
      if (this._sceneObject.state.includeAll) {
        urlValue = handleLegacyUrlAllValue(urlValue);
      }
      if (this._sceneObject.state.allValue && this._sceneObject.state.allValue === urlValue) {
        urlValue = ALL_VARIABLE_VALUE;
      }
      if (!this._sceneObject.isActive) {
        this._sceneObject.skipNextValidation = true;
      }
      this._sceneObject.changeValueTo(urlValue);
    }
  }
}
function handleLegacyUrlAllValue(value) {
  if (lodash.isArray(value) && value[0] === ALL_VARIABLE_TEXT) {
    return [ALL_VARIABLE_VALUE];
  } else if (value === ALL_VARIABLE_TEXT) {
    return ALL_VARIABLE_VALUE;
  }
  return value;
}
class CustomAllValue {
  constructor(_value, _variable) {
    this._value = _value;
    this._variable = _variable;
  }
  formatter(formatNameOrFn) {
    if (formatNameOrFn === schema.VariableFormatID.Text) {
      return ALL_VARIABLE_TEXT;
    }
    if (formatNameOrFn === schema.VariableFormatID.PercentEncode) {
      return formatRegistry.get(schema.VariableFormatID.PercentEncode).formatter(this._value, [], this._variable);
    }
    if (formatNameOrFn === schema.VariableFormatID.QueryParam) {
      return formatRegistry.get(schema.VariableFormatID.QueryParam).formatter(ALL_VARIABLE_TEXT, [], this._variable);
    }
    return this._value;
  }
}

class AllVariablesMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "url_variable" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    const allVars = collectAllVariables(this._sceneObject);
    const format = formatRegistry.get(schema.VariableFormatID.QueryParam);
    const params = [];
    for (const name of Object.keys(allVars)) {
      const variable = allVars[name];
      if (variable instanceof MultiValueVariable && variable.hasAllValue() && !variable.state.allValue) {
        params.push(format.formatter(ALL_VARIABLE_VALUE, [], variable));
        continue;
      }
      const value = variable.getValue();
      if (!value) {
        continue;
      }
      if (isCustomVariableValue(value)) {
        params.push(value.formatter(schema.VariableFormatID.QueryParam));
      } else {
        params.push(format.formatter(value, [], variable));
      }
    }
    return new SkipFormattingValue(params.join("&"));
  }
  getValueText() {
    return "";
  }
}
function collectAllVariables(sceneObject, record = {}) {
  if (sceneObject.state.$variables) {
    for (const variable of sceneObject.state.$variables.state.variables) {
      if (variable.state.skipUrlSync) {
        continue;
      }
      if (!record[variable.state.name]) {
        record[variable.state.name] = variable;
      }
    }
  }
  if (sceneObject.parent) {
    collectAllVariables(sceneObject.parent, record);
  }
  return record;
}

var __defProp$J = Object.defineProperty;
var __defProps$v = Object.defineProperties;
var __getOwnPropDescs$v = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$J = Object.getOwnPropertySymbols;
var __hasOwnProp$J = Object.prototype.hasOwnProperty;
var __propIsEnum$J = Object.prototype.propertyIsEnumerable;
var __defNormalProp$J = (obj, key, value) => key in obj ? __defProp$J(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$J = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$J.call(b, prop))
      __defNormalProp$J(a, prop, b[prop]);
  if (__getOwnPropSymbols$J)
    for (var prop of __getOwnPropSymbols$J(b)) {
      if (__propIsEnum$J.call(b, prop))
        __defNormalProp$J(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$v = (a, b) => __defProps$v(a, __getOwnPropDescs$v(b));
function getTemplateProxyForField(field, frame, frames) {
  return new Proxy(
    {},
    {
      get: (obj, key) => {
        if (key === "name") {
          return field.name;
        }
        if (key === "displayName") {
          return data.getFieldDisplayName(field, frame, frames);
        }
        if (key === "labels" || key === "formattedLabels") {
          if (!field.labels) {
            return "";
          }
          return __spreadProps$v(__spreadValues$J({}, field.labels), {
            __values: Object.values(field.labels).sort().join(", "),
            toString: () => {
              return data.formatLabels(field.labels, "", true);
            }
          });
        }
        return void 0;
      }
    }
  );
}

class ValueMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__value" };
  }
  getValue(fieldPath) {
    var _a, _b;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext) {
      return this._match;
    }
    const { frame, rowIndex, field, calculatedValue } = dataContext.value;
    if (calculatedValue) {
      switch (fieldPath) {
        case "numeric":
          return calculatedValue.numeric;
        case "raw":
          return calculatedValue.numeric;
        case "time":
          return "";
        case "text":
        default:
          return data.formattedValueToString(calculatedValue);
      }
    }
    if (rowIndex == null) {
      return this._match;
    }
    if (fieldPath === "time") {
      const timeField = frame.fields.find((f) => f.type === data.FieldType.time);
      return timeField ? timeField.values.get(rowIndex) : void 0;
    }
    if (!field) {
      return this._match;
    }
    const value = field.values.get(rowIndex);
    if (fieldPath === "raw") {
      return value;
    }
    const displayProcessor = (_b = field.display) != null ? _b : fallbackDisplayProcessor;
    const result = displayProcessor(value);
    switch (fieldPath) {
      case "numeric":
        return result.numeric;
      case "text":
      default:
        return data.formattedValueToString(result);
    }
  }
  getValueText() {
    return "";
  }
}
const fallbackDisplayProcessor = data.getDisplayProcessor();
class DataMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__data" };
  }
  getValue(fieldPath) {
    var _a, _b;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }
    const { frame, rowIndex } = dataContext.value;
    if (rowIndex === void 0 || fieldPath === void 0) {
      return this._match;
    }
    const obj = {
      name: frame.name,
      refId: frame.refId,
      fields: data.getFieldDisplayValuesProxy({ frame, rowIndex })
    };
    return (_b = getFieldAccessor(fieldPath)(obj)) != null ? _b : "";
  }
  getValueText() {
    return "";
  }
}
class SeriesMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__series" };
  }
  getValue(fieldPath) {
    var _a;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }
    if (fieldPath !== "name") {
      return this._match;
    }
    const { frame, frameIndex } = dataContext.value;
    return data.getFrameDisplayName(frame, frameIndex);
  }
  getValueText() {
    return "";
  }
}
class FieldMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__field" };
  }
  getValue(fieldPath) {
    var _a, _b;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }
    if (fieldPath === void 0 || fieldPath === "") {
      return this._match;
    }
    const { frame, field, data } = dataContext.value;
    const obj = getTemplateProxyForField(field, frame, data);
    return (_b = getFieldAccessor(fieldPath)(obj)) != null ? _b : "";
  }
  getValueText() {
    return "";
  }
}

class UrlMacro {
  constructor(name, _) {
    this.state = { name, type: "url_macro" };
  }
  getValue(fieldPath) {
    var _a;
    const location = runtime.locationService.getLocation();
    const subUrl = (_a = runtime.config.appSubUrl) != null ? _a : "";
    switch (fieldPath != null ? fieldPath : "") {
      case "params":
        return new UrlStateFormatter(location.search);
      case "path":
        return subUrl + location.pathname;
      case "":
      default:
        return subUrl + location.pathname + location.search;
    }
  }
  getValueText() {
    return "";
  }
}
class UrlStateFormatter {
  constructor(_urlQueryParams) {
    this._urlQueryParams = _urlQueryParams;
  }
  formatter(options) {
    if (!options) {
      return this._urlQueryParams;
    }
    const params = options.split(":");
    if (params[0] === "exclude" && params.length > 1) {
      const allParams = new URLSearchParams(this._urlQueryParams);
      for (const param of params[1].split(",")) {
        allParams.delete(param);
      }
      return `?${allParams}`;
    }
    if (params[0] === "include" && params.length > 1) {
      const allParams = new URLSearchParams(this._urlQueryParams);
      const includeOnly = params[1].split(",");
      for (const param of allParams.keys()) {
        if (!includeOnly.includes(param)) {
          allParams.delete(param);
        }
      }
      return `?${allParams}`;
    }
    return this._urlQueryParams;
  }
}

class UserMacro {
  constructor(name, _) {
    this.state = { name, type: "user_macro" };
  }
  getValue(fieldPath) {
    const user = runtime.config.bootData.user;
    switch (fieldPath) {
      case "login":
        return user.login;
      case "email":
        return user.email;
      case "id":
      default:
        return String(user.id);
    }
  }
  getValueText() {
    return "";
  }
}
class OrgMacro {
  constructor(name, _) {
    this.state = { name, type: "org_macro" };
  }
  getValue(fieldPath) {
    const user = runtime.config.bootData.user;
    switch (fieldPath) {
      case "name":
        return user.orgName;
      case "id":
      default:
        return String(user.orgId);
    }
  }
  getValueText() {
    return "";
  }
}

const macrosIndex = /* @__PURE__ */ new Map([
  [data.DataLinkBuiltInVars.includeVars, AllVariablesMacro],
  [data.DataLinkBuiltInVars.keepTime, UrlTimeRangeMacro],
  ["__value", ValueMacro],
  ["__data", DataMacro],
  ["__series", SeriesMacro],
  ["__field", FieldMacro],
  ["__url", UrlMacro],
  ["__from", TimeFromAndToMacro],
  ["__to", TimeFromAndToMacro],
  ["__timezone", TimezoneMacro],
  ["__user", UserMacro],
  ["__org", OrgMacro],
  ["__interval", IntervalMacro],
  ["__interval_ms", IntervalMacro]
]);
function registerVariableMacro(name, macro) {
  if (macrosIndex.get(name)) {
    throw new Error(`Macro already registered ${name}`);
  }
  macrosIndex.set(name, macro);
  return () => {
    macrosIndex.delete(name);
  };
}

function sceneInterpolator(sceneObject, target, scopedVars, format, interpolations) {
  if (!target || typeof target !== "string") {
    return target != null ? target : "";
  }
  VARIABLE_REGEX.lastIndex = 0;
  return target.replace(VARIABLE_REGEX, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
    const variableName = var1 || var2 || var3;
    const fmt = fmt2 || fmt3 || format;
    const variable = lookupFormatVariable(variableName, match, scopedVars, sceneObject);
    if (!variable) {
      if (interpolations) {
        interpolations.push({ match, variableName, fieldPath, format: fmt, value: match, found: false });
      }
      return match;
    }
    const value = formatValue(sceneObject, variable, variable.getValue(fieldPath), fmt);
    if (interpolations) {
      interpolations.push({ match, variableName, fieldPath, format: fmt, value, found: value !== match });
    }
    return value;
  });
}
function lookupFormatVariable(name, match, scopedVars, sceneObject) {
  if (scopedVars && scopedVars.hasOwnProperty(name)) {
    const scopedVar = scopedVars[name];
    if (scopedVar) {
      return getSceneVariableForScopedVar(name, scopedVar);
    }
  }
  const variable = lookupVariable(name, sceneObject);
  if (variable) {
    return variable;
  }
  const Macro = macrosIndex.get(name);
  if (Macro) {
    return new Macro(name, sceneObject, match, scopedVars);
  }
  return null;
}
function formatValue(context, variable, value, formatNameOrFn) {
  if (value === null || value === void 0) {
    return "";
  }
  if (isCustomVariableValue(value)) {
    return sceneInterpolator(context, value.formatter(formatNameOrFn));
  }
  if (!Array.isArray(value) && typeof value === "object") {
    value = `${value}`;
  }
  if (typeof formatNameOrFn === "function") {
    return formatNameOrFn(value, {
      name: variable.state.name,
      type: variable.state.type,
      multi: variable.state.isMulti,
      includeAll: variable.state.includeAll
    });
  }
  let args = [];
  if (!formatNameOrFn) {
    formatNameOrFn = schema.VariableFormatID.Glob;
  } else {
    args = formatNameOrFn.split(":");
    if (args.length > 1) {
      formatNameOrFn = args[0];
      args = args.slice(1);
    } else {
      args = [];
    }
  }
  let formatter = formatRegistry.getIfExists(formatNameOrFn);
  if (!formatter) {
    console.error(`Variable format ${formatNameOrFn} not found. Using glob format as fallback.`);
    formatter = formatRegistry.get(schema.VariableFormatID.Glob);
  }
  return formatter.formatter(value, args, variable);
}

function isSceneObject(obj) {
  return obj.useState !== void 0;
}
function isDataRequestEnricher(obj) {
  return "enrichDataRequest" in obj;
}
function isFiltersRequestEnricher(obj) {
  return "enrichFiltersRequest" in obj;
}
function isDataLayer(obj) {
  return "isDataLayer" in obj;
}

var __accessCheck$2 = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet$2 = (obj, member, getter) => {
  __accessCheck$2(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$2 = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var _running;
function isQueryController(s) {
  return "isQueryController" in s;
}
class SceneQueryController extends SceneObjectBase {
  constructor() {
    super({ isRunning: false });
    this.isQueryController = true;
    __privateAdd$2(this, _running, /* @__PURE__ */ new Set());
    this.addActivationHandler(() => {
      return () => __privateGet$2(this, _running).clear();
    });
  }
  queryStarted(entry) {
    __privateGet$2(this, _running).add(entry);
    this.changeRunningQueryCount(1);
    if (!this.state.isRunning) {
      this.setState({ isRunning: true });
    }
  }
  queryCompleted(entry) {
    if (!__privateGet$2(this, _running).has(entry)) {
      return;
    }
    __privateGet$2(this, _running).delete(entry);
    this.changeRunningQueryCount(-1);
    if (__privateGet$2(this, _running).size === 0) {
      this.setState({ isRunning: false });
    }
  }
  changeRunningQueryCount(dir) {
    var _a;
    window.__grafanaRunningQueryCount = ((_a = window.__grafanaRunningQueryCount) != null ? _a : 0) + dir;
  }
  cancelAll() {
    var _a;
    for (const entry of __privateGet$2(this, _running).values()) {
      (_a = entry.cancel) == null ? void 0 : _a.call(entry);
    }
  }
}
_running = new WeakMap();

function writeSceneLog(logger, message, ...rest) {
  let loggingEnabled = false;
  if (typeof window !== "undefined") {
    loggingEnabled = localStorage.getItem("grafana.debug.scenes") === "true";
  }
  if (loggingEnabled) {
    console.log(`${logger}: `, message, ...rest);
  }
}

async function getDataSource(datasource, scopedVars) {
  if (datasource == null ? void 0 : datasource.uid) {
    const runtimeDataSource = runtimeDataSources.get(datasource.uid);
    if (runtimeDataSource) {
      return runtimeDataSource;
    }
  }
  if (datasource && datasource.query) {
    return datasource;
  }
  return await runtime.getDataSourceSrv().get(datasource, scopedVars);
}

class VariableValueRecorder {
  constructor() {
    this._values = /* @__PURE__ */ new Map();
  }
  recordCurrentDependencyValuesForSceneObject(sceneObject) {
    this.clearValues();
    if (!sceneObject.variableDependency) {
      return;
    }
    for (const variableName of sceneObject.variableDependency.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, sceneObject);
      if (variable) {
        this._values.set(variable.state.name, variable.getValue());
      }
    }
  }
  cloneAndRecordCurrentValuesForSceneObject(sceneObject) {
    const clone = new VariableValueRecorder();
    clone.recordCurrentDependencyValuesForSceneObject(sceneObject);
    return clone;
  }
  clearValues() {
    this._values.clear();
  }
  hasValues() {
    return !!this._values;
  }
  recordCurrentValue(variable) {
    this._values.set(variable.state.name, variable.getValue());
  }
  hasRecordedValue(variable) {
    return this._values.has(variable.state.name);
  }
  hasValueChanged(variable) {
    if (this._values.has(variable.state.name)) {
      const value = this._values.get(variable.state.name);
      if (!isVariableValueEqual(value, variable.getValue())) {
        return true;
      }
    }
    return false;
  }
  hasDependenciesChanged(sceneObject) {
    if (!this._values) {
      return false;
    }
    if (!sceneObject.variableDependency) {
      return false;
    }
    for (const variableName of sceneObject.variableDependency.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, sceneObject);
      if (!variable) {
        continue;
      }
      const name = variable.state.name;
      if (variable && this._values.has(name)) {
        const value = this._values.get(name);
        if (!isVariableValueEqual(value, variable.getValue())) {
          return true;
        }
      }
    }
    return false;
  }
}

function isExtraQueryProvider(obj) {
  return typeof obj === "object" && "getExtraQueries" in obj;
}

var __defProp$I = Object.defineProperty;
var __defProps$u = Object.defineProperties;
var __getOwnPropDescs$u = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$I = Object.getOwnPropertySymbols;
var __hasOwnProp$I = Object.prototype.hasOwnProperty;
var __propIsEnum$I = Object.prototype.propertyIsEnumerable;
var __defNormalProp$I = (obj, key, value) => key in obj ? __defProp$I(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$I = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$I.call(b, prop))
      __defNormalProp$I(a, prop, b[prop]);
  if (__getOwnPropSymbols$I)
    for (var prop of __getOwnPropSymbols$I(b)) {
      if (__propIsEnum$I.call(b, prop))
        __defNormalProp$I(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$u = (a, b) => __defProps$u(a, __getOwnPropDescs$u(b));
const passthroughProcessor = (_, secondary) => rxjs.of(secondary);
const extraQueryProcessingOperator = (processors) => (data) => {
  return data.pipe(
    rxjs.mergeMap(([primary, ...secondaries]) => {
      const processedSecondaries = secondaries.flatMap((s) => {
        var _a, _b;
        return (_b = (_a = processors.get(s.request.requestId)) == null ? void 0 : _a(primary, s)) != null ? _b : rxjs.of(s);
      });
      return rxjs.forkJoin([rxjs.of(primary), ...processedSecondaries]);
    }),
    rxjs.map(([primary, ...processedSecondaries]) => {
      var _a;
      return __spreadProps$u(__spreadValues$I({}, primary), {
        series: [...primary.series, ...processedSecondaries.flatMap((s) => s.series)],
        annotations: [...(_a = primary.annotations) != null ? _a : [], ...processedSecondaries.flatMap((s) => {
          var _a2;
          return (_a2 = s.annotations) != null ? _a2 : [];
        })]
      });
    })
  );
};

var __defProp$H = Object.defineProperty;
var __defProps$t = Object.defineProperties;
var __getOwnPropDescs$t = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$H = Object.getOwnPropertySymbols;
var __hasOwnProp$H = Object.prototype.hasOwnProperty;
var __propIsEnum$H = Object.prototype.propertyIsEnumerable;
var __defNormalProp$H = (obj, key, value) => key in obj ? __defProp$H(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$H = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$H.call(b, prop))
      __defNormalProp$H(a, prop, b[prop]);
  if (__getOwnPropSymbols$H)
    for (var prop of __getOwnPropSymbols$H(b)) {
      if (__propIsEnum$H.call(b, prop))
        __defNormalProp$H(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$t = (a, b) => __defProps$t(a, __getOwnPropDescs$t(b));
const GLOBAL_ANNOTATION_ID = 0;
function filterAnnotations(data, filters) {
  var _a;
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }
  const rows = Array.from({ length: data.length }, () => /* @__PURE__ */ new Set());
  let frameIdx = 0;
  for (const frame of data) {
    for (let index = 0; index < frame.length; index++) {
      if (rows[frameIdx].has(index)) {
        continue;
      }
      let matching = true;
      const panelIdField = frame.fields.find((f) => f.name === "panelId");
      const sourceField = frame.fields.find((f) => f.name === "source");
      if (sourceField) {
        if (panelIdField && sourceField.values[index].type === "dashboard") {
          matching = [filters.panelId, GLOBAL_ANNOTATION_ID].includes(panelIdField.values[index]);
        }
        const sourceFilter = sourceField.values[index].filter;
        if (sourceFilter) {
          const includes = [...(_a = sourceFilter.ids) != null ? _a : [], GLOBAL_ANNOTATION_ID].includes(filters.panelId);
          if (sourceFilter.exclude) {
            if (includes) {
              matching = false;
            }
          } else if (!includes) {
            matching = false;
          }
        }
      }
      if (matching) {
        rows[frameIdx].add(index);
      }
    }
    frameIdx++;
  }
  const processed = [];
  frameIdx = 0;
  for (const frame of data) {
    const frameLength = rows[frameIdx].size;
    const fields = [];
    for (const field of frame.fields) {
      const buffer = [];
      for (let index = 0; index < frame.length; index++) {
        if (rows[frameIdx].has(index)) {
          buffer.push(field.values[index]);
          continue;
        }
      }
      fields.push(__spreadProps$t(__spreadValues$H({}, field), {
        values: buffer
      }));
    }
    processed.push(__spreadProps$t(__spreadValues$H({}, frame), {
      fields,
      length: frameLength
    }));
    frameIdx++;
  }
  return processed;
}

function getEnrichedDataRequest(sourceRunner) {
  const root = sourceRunner.getRoot();
  if (isDataRequestEnricher(root)) {
    return root.enrichDataRequest(sourceRunner);
  }
  return null;
}

let originalGetAdhocFilters = void 0;
let allActiveFilterSets = /* @__PURE__ */ new Set();
function patchGetAdhocFilters(filterVar) {
  filterVar.addActivationHandler(() => {
    allActiveFilterSets.add(filterVar);
    return () => allActiveFilterSets.delete(filterVar);
  });
  if (originalGetAdhocFilters) {
    return;
  }
  const templateSrv = runtime.getTemplateSrv();
  if (!(templateSrv == null ? void 0 : templateSrv.getAdhocFilters)) {
    console.log("Failed to patch getAdhocFilters");
    return;
  }
  originalGetAdhocFilters = templateSrv.getAdhocFilters;
  templateSrv.getAdhocFilters = function getAdhocFiltersScenePatch(dsName) {
    var _a;
    if (allActiveFilterSets.size === 0) {
      return originalGetAdhocFilters.call(templateSrv, dsName);
    }
    const ds = runtime.getDataSourceSrv().getInstanceSettings(dsName);
    if (!ds) {
      return [];
    }
    for (const filter of allActiveFilterSets.values()) {
      if (((_a = filter.state.datasource) == null ? void 0 : _a.uid) === ds.uid) {
        return filter.state.filters;
      }
    }
    return [];
  }.bind(templateSrv);
}
function findActiveAdHocFilterVariableByUid(dsUid) {
  var _a;
  for (const filter of allActiveFilterSets.values()) {
    if (interpolate(filter, (_a = filter.state.datasource) == null ? void 0 : _a.uid) === dsUid) {
      return filter;
    }
  }
  return void 0;
}

function registerQueryWithController(entry) {
  return (queryStream) => {
    const queryControler = sceneGraph.getQueryController(entry.origin);
    if (!queryControler) {
      return queryStream;
    }
    return new rxjs.Observable((observer) => {
      if (!entry.cancel) {
        entry.cancel = () => observer.complete();
      }
      queryControler.queryStarted(entry);
      let markedAsCompleted = false;
      const sub = queryStream.subscribe({
        next: (v) => {
          if (!markedAsCompleted && v.state !== schema.LoadingState.Loading) {
            markedAsCompleted = true;
            queryControler.queryCompleted(entry);
          }
          observer.next(v);
        },
        error: (e) => observer.error(e),
        complete: () => {
          observer.complete();
        }
      });
      return () => {
        sub.unsubscribe();
        if (!markedAsCompleted) {
          queryControler.queryCompleted(entry);
        }
      };
    });
  };
}

const allActiveGroupByVariables = /* @__PURE__ */ new Set();
function findActiveGroupByVariablesByUid(dsUid) {
  var _a;
  for (const groupByVariable of allActiveGroupByVariables.values()) {
    if (interpolate(groupByVariable, (_a = groupByVariable.state.datasource) == null ? void 0 : _a.uid) === dsUid) {
      return groupByVariable;
    }
  }
  return void 0;
}

function getOptionSearcher(options, includeAll = false) {
  let allOptions = options;
  if (includeAll) {
    allOptions = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...allOptions];
  }
  const haystack = allOptions.map((o) => o.label);
  const fuzzySearch = getFuzzySearcher(haystack);
  return (search) => fuzzySearch(search).map((i) => allOptions[i]);
}

var __defProp$G = Object.defineProperty;
var __defProps$s = Object.defineProperties;
var __getOwnPropDescs$s = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$G = Object.getOwnPropertySymbols;
var __hasOwnProp$G = Object.prototype.hasOwnProperty;
var __propIsEnum$G = Object.prototype.propertyIsEnumerable;
var __defNormalProp$G = (obj, key, value) => key in obj ? __defProp$G(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$G = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$G.call(b, prop))
      __defNormalProp$G(a, prop, b[prop]);
  if (__getOwnPropSymbols$G)
    for (var prop of __getOwnPropSymbols$G(b)) {
      if (__propIsEnum$G.call(b, prop))
        __defNormalProp$G(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$s = (a, b) => __defProps$s(a, __getOwnPropDescs$s(b));
var __objRest$4 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$G.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$G)
    for (var prop of __getOwnPropSymbols$G(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$G.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const filterNoOp$2 = () => true;
const filterAll = (v) => v.value !== "$__all";
const determineToggleAllState = (selectedValues, options) => {
  if (selectedValues.length === options.filter(filterAll).length) {
    return ui.ToggleAllState.allSelected;
  } else if (selectedValues.length === 0 || selectedValues.length === 1 && selectedValues[0] && selectedValues[0].value === "$__all") {
    return ui.ToggleAllState.noneSelected;
  } else {
    return ui.ToggleAllState.indeterminate;
  }
};
function toSelectableValue$2(value, label) {
  return {
    value,
    label: label != null ? label : String(value)
  };
}
function VariableValueSelect({ model }) {
  const { value, text, key, options, includeAll, isReadOnly, allowCustomValue = true } = model.useState();
  const [inputValue, setInputValue] = React.useState("");
  const [hasCustomValue, setHasCustomValue] = React.useState(false);
  const selectValue = toSelectableValue$2(value, String(text));
  const optionSearcher = React.useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);
  const onInputChange = (value2, { action }) => {
    if (action === "input-change") {
      setInputValue(value2);
      if (model.onSearchChange) {
        model.onSearchChange(value2);
      }
      return value2;
    }
    return value2;
  };
  const filteredOptions = optionSearcher(inputValue);
  const onOpenMenu = () => {
    if (hasCustomValue) {
      setInputValue(String(text));
    }
  };
  const onCloseMenu = () => {
    setInputValue("");
  };
  return /* @__PURE__ */ React__default["default"].createElement(ui.Select, {
    id: key,
    isValidNewOption: (inputValue2) => inputValue2.trim().length > 0,
    placeholder: "Select value",
    width: "auto",
    disabled: isReadOnly,
    value: selectValue,
    inputValue,
    allowCustomValue,
    virtualized: true,
    filterOption: filterNoOp$2,
    tabSelectsValue: false,
    onInputChange,
    onOpenMenu,
    onCloseMenu,
    options: filteredOptions,
    "data-testid": e2eSelectors.selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${value}`),
    onChange: (newValue) => {
      model.changeValueTo(newValue.value, newValue.label);
      if (hasCustomValue !== newValue.__isNew__) {
        setHasCustomValue(newValue.__isNew__);
      }
    }
  });
}
function VariableValueSelectMulti({ model }) {
  const {
    value,
    options,
    key,
    maxVisibleValues,
    noValueOnClear,
    includeAll,
    isReadOnly,
    allowCustomValue = true
  } = model.useState();
  const arrayValue = React.useMemo(() => lodash.isArray(value) ? value : [value], [value]);
  const [uncommittedValue, setUncommittedValue] = React.useState(arrayValue);
  const [inputValue, setInputValue] = React.useState("");
  const optionSearcher = React.useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);
  React.useEffect(() => {
    setUncommittedValue(arrayValue);
  }, [arrayValue]);
  const onInputChange = (value2, { action }) => {
    if (action === "input-change") {
      setInputValue(value2);
      if (model.onSearchChange) {
        model.onSearchChange(value2);
      }
      return value2;
    }
    if (action === "input-blur") {
      setInputValue("");
      return "";
    }
    return inputValue;
  };
  const placeholder = options.length > 0 ? "Select value" : "";
  const filteredOptions = optionSearcher(inputValue);
  return /* @__PURE__ */ React__default["default"].createElement(ui.MultiSelect, {
    id: key,
    placeholder,
    width: "auto",
    inputValue,
    disabled: isReadOnly,
    value: uncommittedValue,
    noMultiValueWrap: true,
    maxVisibleValues: maxVisibleValues != null ? maxVisibleValues : 5,
    tabSelectsValue: false,
    virtualized: true,
    allowCustomValue,
    toggleAllOptions: {
      enabled: true,
      optionsFilter: filterAll,
      determineToggleAllState
    },
    options: filteredOptions,
    closeMenuOnSelect: false,
    components: { Option: OptionWithCheckbox },
    isClearable: true,
    hideSelectedOptions: false,
    onInputChange,
    onBlur: () => {
      model.changeValueTo(uncommittedValue);
    },
    filterOption: filterNoOp$2,
    "data-testid": e2eSelectors.selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${uncommittedValue}`),
    onChange: (newValue, action) => {
      if (action.action === "clear" && noValueOnClear) {
        model.changeValueTo([]);
      }
      setUncommittedValue(newValue.map((x) => x.value));
    }
  });
}
const OptionWithCheckbox = ({
  children,
  data,
  innerProps,
  innerRef,
  isFocused,
  isSelected,
  indeterminate,
  renderOptionLabel
}) => {
  var _b;
  const _a = innerProps, rest = __objRest$4(_a, ["onMouseMove", "onMouseOver"]);
  const theme = ui.useTheme2();
  const selectStyles = ui.getSelectStyles(theme);
  const optionStyles = ui.useStyles2(getOptionStyles);
  return /* @__PURE__ */ React__default["default"].createElement("div", __spreadProps$s(__spreadValues$G({
    ref: innerRef,
    className: css.cx(selectStyles.option, isFocused && selectStyles.optionFocused)
  }, rest), {
    "data-testid": "data-testid Select option",
    title: data.title
  }), /* @__PURE__ */ React__default["default"].createElement("div", {
    className: optionStyles.checkbox
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Checkbox, {
    indeterminate,
    value: isSelected
  })), /* @__PURE__ */ React__default["default"].createElement("div", {
    className: selectStyles.optionBody,
    "data-testid": e2eSelectors.selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownOptionTexts(
      (_b = data.label) != null ? _b : String(data.value)
    )
  }, /* @__PURE__ */ React__default["default"].createElement("span", null, children)));
};
OptionWithCheckbox.displayName = "SelectMenuOptions";
const getOptionStyles = (theme) => ({
  checkbox: css.css({
    marginRight: theme.spacing(2)
  })
});
function renderSelectForVariable(model) {
  if (model.state.isMulti) {
    return /* @__PURE__ */ React__default["default"].createElement(VariableValueSelectMulti, {
      model
    });
  } else {
    return /* @__PURE__ */ React__default["default"].createElement(VariableValueSelect, {
      model
    });
  }
}

class GroupByVariableUrlSyncHandler {
  constructor(_sceneObject) {
    this._sceneObject = _sceneObject;
  }
  getKey() {
    return `var-${this._sceneObject.state.name}`;
  }
  getKeys() {
    if (this._sceneObject.state.skipUrlSync) {
      return [];
    }
    return [this.getKey()];
  }
  getUrlState() {
    if (this._sceneObject.state.skipUrlSync) {
      return {};
    }
    return { [this.getKey()]: toUrlValues(this._sceneObject.state.value, this._sceneObject.state.text) };
  }
  updateFromUrl(values) {
    let urlValue = values[this.getKey()];
    if (urlValue != null) {
      if (!this._sceneObject.isActive) {
        this._sceneObject.skipNextValidation = true;
      }
      const { values: values2, texts } = fromUrlValues(urlValue);
      this._sceneObject.changeValueTo(values2, texts);
    }
  }
}
function toUrlValues(values, texts) {
  values = Array.isArray(values) ? values : [values];
  texts = Array.isArray(texts) ? texts : [texts];
  return values.map((value, idx) => {
    if (value === void 0 || value === null) {
      return "";
    }
    value = String(value);
    let text = texts[idx];
    text = text === void 0 || text === null ? value : String(text);
    return toUrlCommaDelimitedString(value, text);
  });
}
function fromUrlValues(urlValues) {
  urlValues = Array.isArray(urlValues) ? urlValues : [urlValues];
  return urlValues.reduce(
    (acc, urlValue) => {
      const [value, label] = (urlValue != null ? urlValue : "").split(",");
      acc.values.push(unescapeUrlDelimiters(value));
      acc.texts.push(unescapeUrlDelimiters(label != null ? label : value));
      return acc;
    },
    {
      values: [],
      texts: []
    }
  );
}

function getEnrichedFiltersRequest(sourceRunner) {
  const root = sourceRunner.getRoot();
  if (isFiltersRequestEnricher(root)) {
    return root.enrichFiltersRequest(sourceRunner);
  }
  return null;
}

var __accessCheck$1 = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet$1 = (obj, member, getter) => {
  __accessCheck$1(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$1 = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$1 = (obj, member, value, setter) => {
  __accessCheck$1(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _value;
class SafeSerializableSceneObject {
  constructor(value) {
    __privateAdd$1(this, _value, void 0);
    this.text = "__sceneObject";
    this.valueOf = () => {
      return __privateGet$1(this, _value);
    };
    __privateSet$1(this, _value, value);
  }
  toString() {
    return void 0;
  }
  get value() {
    return this;
  }
}
_value = new WeakMap();

function shouldWrapInSafeSerializableSceneObject(grafanaVersion) {
  const pattern = /^(\d+)\.(\d+)\.(\d+)/;
  const match = grafanaVersion.match(pattern);
  if (!match) {
    return false;
  }
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);
  if (major === 11) {
    return minor === 0 && patch >= 4 || minor === 1 && patch >= 2 || minor > 1;
  }
  if (major === 10) {
    return minor === 4 && patch >= 8 || minor >= 5;
  }
  return major > 11;
}
function wrapInSafeSerializableSceneObject(sceneObject) {
  const version = runtime.config.buildInfo.version;
  if (shouldWrapInSafeSerializableSceneObject(version)) {
    return new SafeSerializableSceneObject(sceneObject);
  }
  return { value: sceneObject, text: "__sceneObject" };
}

var __defProp$F = Object.defineProperty;
var __defProps$r = Object.defineProperties;
var __getOwnPropDescs$r = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$F = Object.getOwnPropertySymbols;
var __hasOwnProp$F = Object.prototype.hasOwnProperty;
var __propIsEnum$F = Object.prototype.propertyIsEnumerable;
var __defNormalProp$F = (obj, key, value) => key in obj ? __defProp$F(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$F = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$F.call(b, prop))
      __defNormalProp$F(a, prop, b[prop]);
  if (__getOwnPropSymbols$F)
    for (var prop of __getOwnPropSymbols$F(b)) {
      if (__propIsEnum$F.call(b, prop))
        __defNormalProp$F(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$r = (a, b) => __defProps$r(a, __getOwnPropDescs$r(b));
class GroupByVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadProps$r(__spreadValues$F({
      isMulti: true,
      name: "",
      value: [],
      text: [],
      options: [],
      datasource: null,
      baseFilters: [],
      applyMode: "auto",
      layout: "horizontal",
      type: "groupby"
    }, initialState), {
      noValueOnClear: true
    }));
    this.isLazy = true;
    this._urlSync = new GroupByVariableUrlSyncHandler(this);
    this._getKeys = async (ds) => {
      var _a, _b, _c;
      const override = await ((_b = (_a = this.state).getTagKeysProvider) == null ? void 0 : _b.call(_a, this, null));
      if (override && override.replace) {
        return override.values;
      }
      if (this.state.defaultOptions) {
        return this.state.defaultOptions.concat(dataFromResponse((_c = override == null ? void 0 : override.values) != null ? _c : []));
      }
      if (!ds.getTagKeys) {
        return [];
      }
      const queries = getQueriesForVariables(this);
      const otherFilters = this.state.baseFilters || [];
      const timeRange = sceneGraph.getTimeRange(this).state.value;
      const response = await ds.getTagKeys(__spreadValues$F({
        filters: otherFilters,
        queries,
        timeRange
      }, getEnrichedFiltersRequest(this)));
      if (responseHasError(response)) {
        this.setState({ error: response.error.message });
      }
      let keys = dataFromResponse(response);
      if (override) {
        keys = keys.concat(dataFromResponse(override.values));
      }
      const tagKeyRegexFilter = this.state.tagKeyRegexFilter;
      if (tagKeyRegexFilter) {
        keys = keys.filter((f) => f.text.match(tagKeyRegexFilter));
      }
      return keys;
    };
    if (this.state.applyMode === "auto") {
      this.addActivationHandler(() => {
        allActiveGroupByVariables.add(this);
        return () => allActiveGroupByVariables.delete(this);
      });
    }
  }
  validateAndUpdate() {
    return this.getValueOptions({}).pipe(
      rxjs.map((options) => {
        this._updateValueGivenNewOptions(options);
        return {};
      })
    );
  }
  _updateValueGivenNewOptions(options) {
    const { value: currentValue, text: currentText } = this.state;
    const stateUpdate = {
      options,
      loading: false,
      value: currentValue != null ? currentValue : [],
      text: currentText != null ? currentText : []
    };
    this.setState(stateUpdate);
  }
  getValueOptions(args) {
    if (this.state.defaultOptions) {
      return rxjs.of(
        this.state.defaultOptions.map((o) => ({
          label: o.text,
          value: String(o.value),
          group: o.group
        }))
      );
    }
    this.setState({ loading: true, error: null });
    return rxjs.from(
      getDataSource(this.state.datasource, {
        __sceneObject: wrapInSafeSerializableSceneObject(this)
      })
    ).pipe(
      rxjs.mergeMap((ds) => {
        return rxjs.from(this._getKeys(ds)).pipe(
          rxjs.tap((response) => {
            if (responseHasError(response)) {
              this.setState({ error: response.error.message });
            }
          }),
          rxjs.map((response) => dataFromResponse(response)),
          rxjs.take(1),
          rxjs.mergeMap((data) => {
            const a = data.map((i) => {
              return {
                label: i.text,
                value: i.value ? String(i.value) : i.text,
                group: i.group
              };
            });
            return rxjs.of(a);
          })
        );
      })
    );
  }
  getDefaultMultiState(options) {
    return { value: [], text: [] };
  }
}
GroupByVariable.Component = GroupByVariableRenderer;
function GroupByVariableRenderer({ model }) {
  const {
    value,
    text,
    key,
    isMulti = true,
    maxVisibleValues,
    noValueOnClear,
    options,
    includeAll,
    allowCustomValue = true
  } = model.useState();
  const values = React.useMemo(() => {
    const arrayValue = lodash.isArray(value) ? value : [value];
    const arrayText = lodash.isArray(text) ? text : [text];
    return arrayValue.map((value2, idx) => {
      var _a;
      return {
        value: value2,
        label: String((_a = arrayText[idx]) != null ? _a : value2)
      };
    });
  }, [value, text]);
  const [isFetchingOptions, setIsFetchingOptions] = React.useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [uncommittedValue, setUncommittedValue] = React.useState(values);
  const optionSearcher = React.useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);
  React.useEffect(() => {
    setUncommittedValue(values);
  }, [values]);
  const onInputChange = (value2, { action }) => {
    if (action === "input-change") {
      setInputValue(value2);
      if (model.onSearchChange) {
        model.onSearchChange(value2);
      }
      return value2;
    }
    if (action === "input-blur") {
      setInputValue("");
      return "";
    }
    return inputValue;
  };
  const filteredOptions = React.useMemo(
    () => handleOptionGroups(optionSearcher(inputValue).map(toSelectableValue$1)),
    [optionSearcher, inputValue]
  );
  return isMulti ? /* @__PURE__ */ React__default["default"].createElement(ui.MultiSelect, {
    "aria-label": "Group by selector",
    "data-testid": `GroupBySelect-${key}`,
    id: key,
    placeholder: "Select value",
    width: "auto",
    allowCustomValue,
    inputValue,
    value: uncommittedValue,
    noMultiValueWrap: true,
    maxVisibleValues: maxVisibleValues != null ? maxVisibleValues : 5,
    tabSelectsValue: false,
    virtualized: true,
    options: filteredOptions,
    filterOption: filterNoOp$1,
    closeMenuOnSelect: false,
    isOpen: isOptionsOpen,
    isClearable: true,
    hideSelectedOptions: false,
    isLoading: isFetchingOptions,
    components: { Option: OptionWithCheckbox },
    onInputChange,
    onBlur: () => {
      model.changeValueTo(
        uncommittedValue.map((x) => x.value),
        uncommittedValue.map((x) => x.label)
      );
    },
    onChange: (newValue, action) => {
      if (action.action === "clear" && noValueOnClear) {
        model.changeValueTo([]);
      }
      setUncommittedValue(newValue);
    },
    onOpenMenu: async () => {
      setIsFetchingOptions(true);
      await rxjs.lastValueFrom(model.validateAndUpdate());
      setIsFetchingOptions(false);
      setIsOptionsOpen(true);
    },
    onCloseMenu: () => {
      setIsOptionsOpen(false);
    }
  }) : /* @__PURE__ */ React__default["default"].createElement(ui.Select, {
    "aria-label": "Group by selector",
    "data-testid": `GroupBySelect-${key}`,
    id: key,
    placeholder: "Select value",
    width: "auto",
    inputValue,
    value: uncommittedValue,
    allowCustomValue,
    noMultiValueWrap: true,
    maxVisibleValues: maxVisibleValues != null ? maxVisibleValues : 5,
    tabSelectsValue: false,
    virtualized: true,
    options: filteredOptions,
    filterOption: filterNoOp$1,
    closeMenuOnSelect: true,
    isOpen: isOptionsOpen,
    isClearable: true,
    hideSelectedOptions: false,
    noValueOnClear: true,
    isLoading: isFetchingOptions,
    onInputChange,
    onChange: (newValue, action) => {
      if (action.action === "clear") {
        setUncommittedValue([]);
        if (noValueOnClear) {
          model.changeValueTo([]);
        }
        return;
      }
      if (newValue == null ? void 0 : newValue.value) {
        setUncommittedValue([newValue]);
        model.changeValueTo([newValue.value], newValue.label ? [newValue.label] : void 0);
      }
    },
    onOpenMenu: async () => {
      setIsFetchingOptions(true);
      await rxjs.lastValueFrom(model.validateAndUpdate());
      setIsFetchingOptions(false);
      setIsOptionsOpen(true);
    },
    onCloseMenu: () => {
      setIsOptionsOpen(false);
    }
  });
}
const filterNoOp$1 = () => true;
function toSelectableValue$1(input) {
  const { label, value, group } = input;
  const result = {
    label,
    value
  };
  if (group) {
    result.group = group;
  }
  return result;
}

function LoadingIndicator(props) {
  return /* @__PURE__ */ React__default["default"].createElement(ui.Tooltip, {
    content: "Cancel query"
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
    className: "spin-clockwise",
    name: "sync",
    size: "xs",
    role: "button",
    onMouseDown: (e) => {
      props.onCancel(e);
    }
  }));
}

function ControlsLabel(props) {
  const styles = ui.useStyles2(getStyles$g);
  const theme = ui.useTheme2();
  const isVertical = props.layout === "vertical";
  const loadingIndicator = Boolean(props.isLoading) ? /* @__PURE__ */ React__default["default"].createElement("div", {
    style: { marginLeft: theme.spacing(1), marginTop: "-1px" },
    "aria-label": e2eSelectors.selectors.components.LoadingIndicator.icon
  }, /* @__PURE__ */ React__default["default"].createElement(LoadingIndicator, {
    onCancel: (e) => {
      var _a;
      e.preventDefault();
      e.stopPropagation();
      (_a = props.onCancel) == null ? void 0 : _a.call(props);
    }
  })) : null;
  let errorIndicator = null;
  if (props.error) {
    errorIndicator = /* @__PURE__ */ React__default["default"].createElement(ui.Tooltip, {
      content: props.error,
      placement: "bottom"
    }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
      className: styles.errorIcon,
      name: "exclamation-triangle"
    }));
  }
  let descriptionIndicator = null;
  if (props.description) {
    descriptionIndicator = /* @__PURE__ */ React__default["default"].createElement(ui.Tooltip, {
      content: props.description,
      placement: isVertical ? "top" : "bottom"
    }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
      className: styles.normalIcon,
      name: "info-circle"
    }));
  }
  const testId = typeof props.label === "string" ? e2eSelectors.selectors.pages.Dashboard.SubMenu.submenuItemLabels(props.label) : "";
  let labelElement;
  if (isVertical) {
    labelElement = /* @__PURE__ */ React__default["default"].createElement("label", {
      className: styles.verticalLabel,
      "data-testid": testId,
      htmlFor: props.htmlFor
    }, props.label, descriptionIndicator, errorIndicator, props.icon && /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
      name: props.icon,
      className: styles.normalIcon
    }), loadingIndicator, props.onRemove && /* @__PURE__ */ React__default["default"].createElement(ui.IconButton, {
      variant: "secondary",
      size: "xs",
      name: "times",
      onClick: props.onRemove,
      tooltip: "Remove"
    }));
  } else {
    labelElement = /* @__PURE__ */ React__default["default"].createElement("label", {
      className: styles.horizontalLabel,
      "data-testid": testId,
      htmlFor: props.htmlFor
    }, errorIndicator, props.icon && /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
      name: props.icon,
      className: styles.normalIcon
    }), props.label, descriptionIndicator, loadingIndicator);
  }
  return labelElement;
}
const getStyles$g = (theme) => ({
  horizontalLabel: css.css({
    background: theme.isDark ? theme.colors.background.primary : theme.colors.background.secondary,
    display: `flex`,
    alignItems: "center",
    padding: theme.spacing(0, 1),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    height: theme.spacing(theme.components.height.md),
    lineHeight: theme.spacing(theme.components.height.md),
    borderRadius: theme.shape.borderRadius(1),
    border: `1px solid ${theme.components.input.borderColor}`,
    position: "relative",
    right: -1,
    whiteSpace: "nowrap",
    gap: theme.spacing(0.5)
  }),
  verticalLabel: css.css({
    display: `flex`,
    alignItems: "center",
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    whiteSpace: "nowrap",
    marginBottom: theme.spacing(0.5),
    gap: theme.spacing(1)
  }),
  errorIcon: css.css({
    color: theme.colors.error.text
  }),
  normalIcon: css.css({
    color: theme.colors.text.secondary
  })
});

function getAdhocOptionSearcher(options) {
  const haystack = options.map((o) => {
    var _a;
    return (_a = o.label) != null ? _a : String(o.value);
  });
  const fuzzySearch = getFuzzySearcher(haystack);
  return (search) => fuzzySearch(search).map((i) => options[i]);
}

var __defProp$E = Object.defineProperty;
var __getOwnPropSymbols$E = Object.getOwnPropertySymbols;
var __hasOwnProp$E = Object.prototype.hasOwnProperty;
var __propIsEnum$E = Object.prototype.propertyIsEnumerable;
var __defNormalProp$E = (obj, key, value) => key in obj ? __defProp$E(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$E = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$E.call(b, prop))
      __defNormalProp$E(a, prop, b[prop]);
  if (__getOwnPropSymbols$E)
    for (var prop of __getOwnPropSymbols$E(b)) {
      if (__propIsEnum$E.call(b, prop))
        __defNormalProp$E(a, prop, b[prop]);
    }
  return a;
};
function keyLabelToOption(key, label) {
  return key !== "" ? {
    value: key,
    label: label || key
  } : null;
}
const filterNoOp = () => true;
function AdHocFilterRenderer({ filter, model }) {
  var _a, _b, _c, _d, _e;
  const styles = ui.useStyles2(getStyles$f);
  const [keys, setKeys] = React.useState([]);
  const [values, setValues] = React.useState([]);
  const [isKeysLoading, setIsKeysLoading] = React.useState(false);
  const [isValuesLoading, setIsValuesLoading] = React.useState(false);
  const [isKeysOpen, setIsKeysOpen] = React.useState(false);
  const [isValuesOpen, setIsValuesOpen] = React.useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = React.useState(false);
  const [valueInputValue, setValueInputValue] = React.useState("");
  const [valueHasCustomValue, setValueHasCustomValue] = React.useState(false);
  const [uncommittedValue, setUncommittedValue] = React.useState(
    filter.values ? filter.values.map((value, index) => {
      var _a2;
      return keyLabelToOption(value, (_a2 = filter.valueLabels) == null ? void 0 : _a2[index]);
    }) : []
  );
  const isMultiValue = isMultiValueOperator(filter.operator);
  const keyValue = keyLabelToOption(filter.key, filter.keyLabel);
  const valueValue = keyLabelToOption(filter.value, (_a = filter.valueLabels) == null ? void 0 : _a[0]);
  const optionSearcher = React.useMemo(() => getAdhocOptionSearcher(values), [values]);
  const onValueInputChange = (value, { action }) => {
    if (action === "input-change") {
      setValueInputValue(value);
    }
    return value;
  };
  const onOperatorChange = (v) => {
    var _a2, _b2;
    const existingOperator = filter.operator;
    const newOperator = v.value;
    const update = { operator: newOperator };
    if (isMultiValueOperator(existingOperator) && !isMultiValueOperator(newOperator)) {
      update.value = "";
      update.valueLabels = [""];
      update.values = void 0;
      setUncommittedValue([]);
    } else if (!isMultiValueOperator(existingOperator) && isMultiValueOperator(newOperator) && filter.value) {
      update.values = [filter.value];
      setUncommittedValue([
        {
          value: filter.value,
          label: (_b2 = (_a2 = filter.valueLabels) == null ? void 0 : _a2[0]) != null ? _b2 : filter.value
        }
      ]);
    }
    model._updateFilter(filter, update);
  };
  const filteredValueOptions = React.useMemo(
    () => handleOptionGroups(optionSearcher(valueInputValue)),
    [optionSearcher, valueInputValue]
  );
  const multiValueProps = {
    isMulti: true,
    value: uncommittedValue,
    components: {
      Option: OptionWithCheckbox
    },
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    openMenuOnFocus: false,
    onChange: (v) => {
      setUncommittedValue(v);
      if (v.some((value) => value.__isNew__)) {
        setValueInputValue("");
      }
    },
    onBlur: () => {
      var _a2, _b2;
      model._updateFilter(filter, {
        value: (_b2 = (_a2 = uncommittedValue[0]) == null ? void 0 : _a2.value) != null ? _b2 : "",
        values: uncommittedValue.map((option) => option.value),
        valueLabels: uncommittedValue.map((option) => option.label)
      });
    }
  };
  const valueSelect = /* @__PURE__ */ React__default["default"].createElement(ui.Select, __spreadValues$E({
    virtualized: true,
    allowCustomValue: (_b = model.state.allowCustomValue) != null ? _b : true,
    isValidNewOption: (inputValue) => inputValue.trim().length > 0,
    allowCreateWhileLoading: true,
    createOptionPosition: "first",
    formatCreateLabel: (inputValue) => `Use custom value: ${inputValue}`,
    disabled: model.state.readOnly,
    className: css.cx(styles.value, isValuesOpen ? styles.widthWhenOpen : void 0),
    width: "auto",
    value: valueValue,
    filterOption: filterNoOp,
    placeholder: "Select value",
    options: filteredValueOptions,
    inputValue: valueInputValue,
    onInputChange: onValueInputChange,
    onChange: (v) => {
      model._updateFilter(filter, {
        value: v.value,
        valueLabels: v.label ? [v.label] : [v.value]
      });
      if (valueHasCustomValue !== v.__isNew__) {
        setValueHasCustomValue(v.__isNew__);
      }
    },
    isOpen: isValuesOpen && !isValuesLoading,
    isLoading: isValuesLoading,
    openMenuOnFocus: true,
    onOpenMenu: async () => {
      var _a2;
      setIsValuesLoading(true);
      setIsValuesOpen(true);
      const values2 = await model._getValuesFor(filter);
      setIsValuesLoading(false);
      setValues(values2);
      if (valueHasCustomValue) {
        setValueInputValue((_a2 = valueValue == null ? void 0 : valueValue.label) != null ? _a2 : "");
      }
    },
    onCloseMenu: () => {
      setIsValuesOpen(false);
      setValueInputValue("");
    }
  }, isMultiValue && multiValueProps));
  const keySelect = /* @__PURE__ */ React__default["default"].createElement(ui.Select, {
    key: `${isValuesLoading ? "loading" : "loaded"}`,
    disabled: model.state.readOnly,
    className: css.cx(styles.key, isKeysOpen ? styles.widthWhenOpen : void 0),
    width: "auto",
    allowCustomValue: (_c = model.state.allowCustomValue) != null ? _c : true,
    value: keyValue,
    placeholder: "Select label",
    options: handleOptionGroups(keys),
    onChange: (v) => {
      model._updateFilter(filter, {
        key: v.value,
        keyLabel: v.label,
        value: "",
        valueLabels: [""],
        values: void 0
      });
      setUncommittedValue([]);
    },
    autoFocus: filter.key === "",
    isOpen: isKeysOpen && !isKeysLoading,
    isLoading: isKeysLoading,
    onOpenMenu: async () => {
      setIsKeysOpen(true);
      setIsKeysLoading(true);
      const keys2 = await model._getKeys(filter.key);
      setIsKeysLoading(false);
      setKeys(keys2);
    },
    onCloseMenu: () => {
      setIsKeysOpen(false);
    },
    onBlur: () => {
      if (filter.key === "") {
        model._removeFilter(filter);
      }
    },
    openMenuOnFocus: true
  });
  const operatorSelect = /* @__PURE__ */ React__default["default"].createElement(ui.Select, {
    className: css.cx(styles.operator, {
      [styles.widthWhenOpen]: isOperatorOpen
    }),
    value: filter.operator,
    disabled: model.state.readOnly,
    options: model._getOperators(),
    onChange: onOperatorChange,
    onOpenMenu: () => {
      setIsOperatorOpen(true);
    },
    onCloseMenu: () => {
      setIsOperatorOpen(false);
    }
  });
  if (model.state.layout === "vertical") {
    if (filter.key) {
      const label = /* @__PURE__ */ React__default["default"].createElement(ControlsLabel, {
        layout: "vertical",
        label: (_d = filter.key) != null ? _d : "",
        onRemove: () => model._removeFilter(filter)
      });
      return /* @__PURE__ */ React__default["default"].createElement(ui.Field, {
        label,
        "data-testid": `AdHocFilter-${filter.key}`,
        className: styles.field
      }, /* @__PURE__ */ React__default["default"].createElement("div", {
        className: styles.wrapper
      }, operatorSelect, valueSelect));
    } else {
      return /* @__PURE__ */ React__default["default"].createElement(ui.Field, {
        label: "Select label",
        "data-testid": `AdHocFilter-${filter.key}`,
        className: styles.field
      }, keySelect);
    }
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.wrapper,
    "data-testid": `AdHocFilter-${filter.key}`
  }, keySelect, operatorSelect, valueSelect, /* @__PURE__ */ React__default["default"].createElement(ui.Button, {
    variant: "secondary",
    "aria-label": "Remove filter",
    title: "Remove filter",
    className: styles.removeButton,
    icon: "times",
    "data-testid": `AdHocFilter-remove-${(_e = filter.key) != null ? _e : ""}`,
    onClick: () => model._removeFilter(filter)
  }));
}
const getStyles$f = (theme) => ({
  field: css.css({
    marginBottom: 0
  }),
  wrapper: css.css({
    display: "flex",
    "> *": {
      "&:not(:first-child)": {
        marginLeft: -1
      },
      "&:first-child": {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0
      },
      "&:last-child": {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0
      },
      "&:not(:first-child):not(:last-child)": {
        borderRadius: 0
      },
      position: "relative",
      zIndex: 0,
      "&:hover": {
        zIndex: 1
      },
      "&:focus-within": {
        zIndex: 2
      }
    }
  }),
  widthWhenOpen: css.css({
    minWidth: theme.spacing(16)
  }),
  value: css.css({
    flexBasis: "content",
    flexShrink: 1,
    minWidth: "90px"
  }),
  key: css.css({
    flexBasis: "content",
    minWidth: "90px",
    flexShrink: 1
  }),
  operator: css.css({
    flexShrink: 0,
    flexBasis: "content"
  }),
  removeButton: css.css({
    paddingLeft: theme.spacing(3 / 2),
    paddingRight: theme.spacing(3 / 2),
    borderLeft: "none",
    width: theme.spacing(3),
    marginRight: theme.spacing(1),
    boxSizing: "border-box",
    position: "relative",
    left: "1px"
  })
});

function AdHocFilterBuilder({ model, addFilterButtonText }) {
  const { _wip } = model.useState();
  if (!_wip) {
    return /* @__PURE__ */ React__default["default"].createElement(ui.Button, {
      variant: "secondary",
      icon: "plus",
      title: "Add filter",
      "aria-label": "Add filter",
      "data-testid": `AdHocFilter-add`,
      onClick: () => model._addWip()
    }, addFilterButtonText);
  }
  return /* @__PURE__ */ React__default["default"].createElement(AdHocFilterRenderer, {
    filter: _wip,
    model
  });
}

class AdHocFiltersVariableUrlSyncHandler {
  constructor(_variable) {
    this._variable = _variable;
  }
  getKey() {
    return `var-${this._variable.state.name}`;
  }
  getKeys() {
    return [this.getKey()];
  }
  getUrlState() {
    const filters = this._variable.state.filters;
    if (filters.length === 0) {
      return { [this.getKey()]: [""] };
    }
    const value = filters.filter(isFilterComplete).map((filter) => toArray(filter).map(escapeUrlPipeDelimiters).join("|"));
    return { [this.getKey()]: value };
  }
  updateFromUrl(values) {
    const urlValue = values[this.getKey()];
    if (urlValue == null) {
      return;
    }
    const filters = deserializeUrlToFilters(urlValue);
    this._variable.setState({ filters });
  }
}
function deserializeUrlToFilters(value) {
  if (Array.isArray(value)) {
    const values = value;
    return values.map(toFilter).filter(isFilter);
  }
  const filter = toFilter(value);
  return filter === null ? [] : [filter];
}
function toArray(filter) {
  var _a;
  const result = [toUrlCommaDelimitedString(filter.key, filter.keyLabel), filter.operator];
  if (isMultiValueOperator(filter.operator)) {
    filter.values.forEach((value, index) => {
      var _a2;
      result.push(toUrlCommaDelimitedString(value, (_a2 = filter.valueLabels) == null ? void 0 : _a2[index]));
    });
  } else {
    result.push(toUrlCommaDelimitedString(filter.value, (_a = filter.valueLabels) == null ? void 0 : _a[0]));
  }
  return result;
}
function toFilter(urlValue) {
  if (typeof urlValue !== "string" || urlValue.length === 0) {
    return null;
  }
  const [key, keyLabel, operator, _operatorLabel, ...values] = urlValue.split("|").reduce((acc, v) => {
    const [key2, label] = v.split(",");
    acc.push(key2, label != null ? label : key2);
    return acc;
  }, []).map(unescapeUrlDelimiters);
  return {
    key,
    keyLabel,
    operator,
    value: values[0],
    values: isMultiValueOperator(operator) ? values.filter((_, index) => index % 2 === 0) : void 0,
    valueLabels: values.filter((_, index) => index % 2 === 1),
    condition: ""
  };
}
function isFilter(filter) {
  return filter !== null && typeof filter.key === "string" && typeof filter.value === "string";
}

var __defProp$D = Object.defineProperty;
var __getOwnPropSymbols$D = Object.getOwnPropertySymbols;
var __hasOwnProp$D = Object.prototype.hasOwnProperty;
var __propIsEnum$D = Object.prototype.propertyIsEnumerable;
var __defNormalProp$D = (obj, key, value) => key in obj ? __defProp$D(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$D = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$D.call(b, prop))
      __defNormalProp$D(a, prop, b[prop]);
  if (__getOwnPropSymbols$D)
    for (var prop of __getOwnPropSymbols$D(b)) {
      if (__propIsEnum$D.call(b, prop))
        __defNormalProp$D(a, prop, b[prop]);
    }
  return a;
};
var __objRest$3 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$D.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$D)
    for (var prop of __getOwnPropSymbols$D(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$D.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const DropdownItem = React.forwardRef(
  function DropdownItem2(_a, ref) {
    var _b = _a, { children, active, addGroupBottomBorder, isMultiValueEdit, checked } = _b, rest = __objRest$3(_b, ["children", "active", "addGroupBottomBorder", "isMultiValueEdit", "checked"]);
    const styles = ui.useStyles2(getStyles$e);
    const id = React.useId();
    return /* @__PURE__ */ React__default["default"].createElement("div", __spreadValues$D({
      ref,
      role: "option",
      id,
      "aria-selected": active,
      className: css.cx(styles.option, active && styles.optionFocused, addGroupBottomBorder && styles.groupBottomBorder)
    }, rest), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: styles.optionBody,
      "data-testid": `data-testid ad hoc filter option value ${children}`
    }, /* @__PURE__ */ React__default["default"].createElement("span", null, isMultiValueEdit ? /* @__PURE__ */ React__default["default"].createElement(ui.Checkbox, {
      tabIndex: -1,
      checked,
      className: styles.checkbox
    }) : null, children)));
  }
);
const getStyles$e = (theme) => ({
  option: css.css({
    label: "grafana-select-option",
    top: 0,
    left: 0,
    width: "100%",
    position: "absolute",
    padding: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    whiteSpace: "nowrap",
    cursor: "pointer",
    "&:hover": {
      background: theme.colors.action.hover,
      "@media (forced-colors: active), (prefers-contrast: more)": {
        border: `1px solid ${theme.colors.primary.border}`
      }
    }
  }),
  optionFocused: css.css({
    label: "grafana-select-option-focused",
    background: theme.colors.action.focus,
    "@media (forced-colors: active), (prefers-contrast: more)": {
      border: `1px solid ${theme.colors.primary.border}`
    }
  }),
  optionBody: css.css({
    label: "grafana-select-option-body",
    display: "flex",
    fontWeight: theme.typography.fontWeightMedium,
    flexDirection: "column",
    flexGrow: 1
  }),
  groupBottomBorder: css.css({
    borderBottom: `1px solid ${theme.colors.border.weak}`
  }),
  checkbox: css.css({
    paddingRight: theme.spacing(0.5)
  }),
  multiValueApplyWrapper: css.css({
    position: "fixed",
    top: 0,
    left: 0,
    display: "flex",
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.z2,
    overflowY: "auto",
    zIndex: theme.zIndex.dropdown,
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(1.5)} ${theme.spacing(1)}`
  })
});
const LoadingOptionsPlaceholder = () => {
  return /* @__PURE__ */ React__default["default"].createElement(DropdownItem, {
    onClick: (e) => e.stopPropagation()
  }, "Loading options...");
};
const NoOptionsPlaceholder = () => {
  return /* @__PURE__ */ React__default["default"].createElement(DropdownItem, {
    onClick: (e) => e.stopPropagation()
  }, "No options found");
};
const OptionsErrorPlaceholder = ({ handleFetchOptions }) => {
  return /* @__PURE__ */ React__default["default"].createElement(DropdownItem, {
    onClick: handleFetchOptions
  }, "An error has occurred fetching labels. Click to retry");
};
const MultiValueApplyButton = ({
  onApply,
  floatingElement,
  maxOptionWidth,
  menuHeight
}) => {
  const styles = ui.useStyles2(getStyles$e);
  const floatingElementRect = floatingElement == null ? void 0 : floatingElement.getBoundingClientRect();
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.multiValueApplyWrapper,
    style: {
      width: `${maxOptionWidth}px`,
      transform: `translate(${floatingElementRect == null ? void 0 : floatingElementRect.left}px,${floatingElementRect ? floatingElementRect.top + menuHeight : 0}px)`
    }
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Button, {
    onClick: onApply,
    size: "sm",
    tabIndex: -1
  }, "Apply"));
};

const VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER = 8;
const VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER = 6;
const VIRTUAL_LIST_PADDING = 8;
const VIRTUAL_LIST_OVERSCAN = 5;
const VIRTUAL_LIST_ITEM_HEIGHT = 38;
const VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION = 60;
const ERROR_STATE_DROPDOWN_WIDTH = 366;
function fuzzySearchOptions(options) {
  const haystack = options.map((o) => {
    var _a;
    return (_a = o.label) != null ? _a : o.value;
  });
  const fuzzySearch = getFuzzySearcher(haystack);
  return (search, filterInputType) => {
    if (filterInputType === "operator" && search !== "") {
      search = `"${search}"`;
    }
    return fuzzySearch(search).map((i) => options[i]);
  };
}
const flattenOptionGroups = (options) => options.flatMap((option) => option.options ? [option, ...option.options] : [option]);
const setupDropdownAccessibility = (options, listRef, disabledIndicesRef) => {
  var _a, _b, _c, _d;
  let maxOptionWidth = 182;
  const listRefArr = [];
  const disabledIndices = [];
  for (let i = 0; i < options.length; i++) {
    listRefArr.push(null);
    if ((_a = options[i]) == null ? void 0 : _a.options) {
      disabledIndices.push(i);
    }
    let label = (_c = (_b = options[i].label) != null ? _b : options[i].value) != null ? _c : "";
    let multiplierToUse = VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER;
    if (label.length * VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER < (((_d = options[i].description) == null ? void 0 : _d.length) || 0) * VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER) {
      label = options[i].description;
      multiplierToUse = VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER;
    }
    const widthEstimate = (options[i].isCustom ? label.length + 18 : label.length) * multiplierToUse + VIRTUAL_LIST_PADDING * 2;
    if (widthEstimate > maxOptionWidth) {
      maxOptionWidth = widthEstimate;
    }
  }
  listRef.current = [...listRefArr];
  disabledIndicesRef.current = [...disabledIndices];
  return maxOptionWidth;
};
const nextInputTypeMap = {
  key: "operator",
  operator: "value",
  value: "key"
};
const switchToNextInputType = (filterInputType, setInputType, handleChangeViewMode, element, shouldFocusOnPillWrapperOverride) => switchInputType(
  nextInputTypeMap[filterInputType],
  setInputType,
  filterInputType === "value" ? handleChangeViewMode : void 0,
  element,
  shouldFocusOnPillWrapperOverride
);
const switchInputType = (filterInputType, setInputType, handleChangeViewMode, element, shouldFocusOnPillWrapperOverride) => {
  setInputType(filterInputType);
  handleChangeViewMode == null ? void 0 : handleChangeViewMode(void 0, shouldFocusOnPillWrapperOverride);
  setTimeout(() => element == null ? void 0 : element.focus());
};
const generateFilterUpdatePayload = ({
  filterInputType,
  item,
  filter,
  setFilterMultiValues
}) => {
  var _a, _b, _c, _d, _e;
  if (filterInputType === "key") {
    return {
      key: item.value,
      keyLabel: item.label ? item.label : item.value
    };
  }
  if (filterInputType === "value") {
    return {
      value: item.value,
      valueLabels: [item.label ? item.label : item.value]
    };
  }
  if (filterInputType === "operator") {
    if (isMultiValueOperator(filter.operator) && !isMultiValueOperator(item.value)) {
      setFilterMultiValues([]);
      return {
        operator: item.value,
        valueLabels: [((_a = filter.valueLabels) == null ? void 0 : _a[0]) || ((_b = filter.values) == null ? void 0 : _b[0]) || filter.value],
        values: void 0
      };
    }
    if (isMultiValueOperator(item.value) && !isMultiValueOperator(filter.operator)) {
      const valueLabels = [((_c = filter.valueLabels) == null ? void 0 : _c[0]) || ((_d = filter.values) == null ? void 0 : _d[0]) || filter.value];
      const values = [filter.value];
      if (values[0]) {
        setFilterMultiValues([
          {
            value: values[0],
            label: (_e = valueLabels == null ? void 0 : valueLabels[0]) != null ? _e : values[0]
          }
        ]);
      }
      return {
        operator: item.value,
        valueLabels,
        values
      };
    }
  }
  return {
    [filterInputType]: item.value
  };
};
const INPUT_PLACEHOLDER = "Filter by label values";
const generatePlaceholder = (filter, filterInputType, isMultiValueEdit, isAlwaysWip) => {
  var _a;
  if (filterInputType === "key") {
    return INPUT_PLACEHOLDER;
  }
  if (filterInputType === "value") {
    if (isMultiValueEdit) {
      return "Edit values";
    }
    return ((_a = filter.valueLabels) == null ? void 0 : _a[0]) || "";
  }
  return filter[filterInputType] && !isAlwaysWip ? `${filter[filterInputType]}` : INPUT_PLACEHOLDER;
};
const populateInputValueOnInputTypeSwitch = ({
  populateInputOnEdit,
  item,
  filterInputType,
  setInputValue,
  filter
}) => {
  if (populateInputOnEdit && !isMultiValueOperator(item.value || "") && nextInputTypeMap[filterInputType] === "value") {
    setInputValue((filter == null ? void 0 : filter.value) || "");
  } else {
    setInputValue("");
  }
};

const MAX_MENU_HEIGHT = 300;
const useFloatingInteractions = ({
  open,
  onOpenChange,
  activeIndex,
  setActiveIndex,
  outsidePressIdsToIgnore,
  listRef,
  disabledIndicesRef
}) => {
  const { refs, floatingStyles, context } = react.useFloating({
    whileElementsMounted: react.autoUpdate,
    open,
    onOpenChange,
    placement: "bottom-start",
    middleware: [
      react.offset(10),
      react.flip({ padding: 10 }),
      react.size({
        apply({ availableHeight, availableWidth, elements }) {
          elements.floating.style.maxHeight = `${Math.min(MAX_MENU_HEIGHT, availableHeight)}px`;
          elements.floating.style.maxWidth = `${availableWidth}px`;
        },
        padding: 10
      })
    ],
    strategy: "fixed"
  });
  const role = react.useRole(context, { role: "listbox" });
  const dismiss = react.useDismiss(context, {
    outsidePress: (event) => {
      var _a;
      if (event.currentTarget instanceof Element) {
        const target = event.currentTarget;
        let idToCompare = target.id;
        if (target.nodeName === "path") {
          idToCompare = ((_a = target.parentElement) == null ? void 0 : _a.id) || "";
        }
        if (outsidePressIdsToIgnore.includes(idToCompare)) {
          return false;
        }
      }
      return true;
    }
  });
  const listNav = react.useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
    disabledIndices: disabledIndicesRef.current
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = react.useInteractions([role, dismiss, listNav]);
  return {
    refs,
    floatingStyles,
    context,
    getReferenceProps,
    getFloatingProps,
    getItemProps
  };
};

var __defProp$C = Object.defineProperty;
var __defProps$q = Object.defineProperties;
var __getOwnPropDescs$q = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$C = Object.getOwnPropertySymbols;
var __hasOwnProp$C = Object.prototype.hasOwnProperty;
var __propIsEnum$C = Object.prototype.propertyIsEnumerable;
var __defNormalProp$C = (obj, key, value) => key in obj ? __defProp$C(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$C = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$C.call(b, prop))
      __defNormalProp$C(a, prop, b[prop]);
  if (__getOwnPropSymbols$C)
    for (var prop of __getOwnPropSymbols$C(b)) {
      if (__propIsEnum$C.call(b, prop))
        __defNormalProp$C(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$q = (a, b) => __defProps$q(a, __getOwnPropDescs$q(b));
const MultiValuePill = ({
  item,
  handleRemoveMultiValue,
  index,
  handleEditMultiValuePill
}) => {
  var _a, _b;
  const styles = ui.useStyles2(getStyles$d);
  const editMultiValuePill = React.useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleEditMultiValuePill(item);
    },
    [handleEditMultiValuePill, item]
  );
  const editMultiValuePillWithKeyboard = React.useCallback(
    (e) => {
      if (e.key === "Enter") {
        editMultiValuePill(e);
      }
    },
    [editMultiValuePill]
  );
  const removePillHandler = React.useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleRemoveMultiValue(item);
    },
    [handleRemoveMultiValue, item]
  );
  const removePillHandlerWithKeyboard = React.useCallback(
    (e) => {
      if (e.key === "Enter") {
        removePillHandler(e);
      }
    },
    [removePillHandler]
  );
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: css.cx(styles.basePill, styles.valuePill),
    onClick: editMultiValuePill,
    onKeyDown: editMultiValuePillWithKeyboard,
    tabIndex: 0,
    id: `${item.value}-${index}`
  }, (_a = item.label) != null ? _a : item.value, /* @__PURE__ */ React__default["default"].createElement(ui.Button, {
    onClick: removePillHandler,
    onKeyDownCapture: removePillHandlerWithKeyboard,
    fill: "text",
    size: "sm",
    variant: "secondary",
    className: styles.removeButton,
    tooltip: `Remove filter value - ${(_b = item.label) != null ? _b : item.value}`
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
    name: "times",
    size: "md",
    id: `${item.value}-${index}-close-icon`
  })));
};
const getStyles$d = (theme) => ({
  basePill: css.css(__spreadProps$q(__spreadValues$C({
    display: "flex",
    alignItems: "center",
    background: theme.colors.action.disabledBackground,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 1, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: "hidden",
    whiteSpace: "nowrap",
    minHeight: theme.spacing(2.75)
  }, theme.typography.bodySmall), {
    cursor: "pointer"
  })),
  valuePill: css.css({
    background: theme.colors.action.selected,
    padding: theme.spacing(0.125, 0, 0.125, 1)
  }),
  removeButton: css.css({
    marginInline: theme.spacing(0.5),
    height: "100%",
    padding: 0,
    cursor: "pointer",
    "&:hover": {
      color: theme.colors.text.primary
    }
  })
});

var __defProp$B = Object.defineProperty;
var __defProps$p = Object.defineProperties;
var __getOwnPropDescs$p = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$B = Object.getOwnPropertySymbols;
var __hasOwnProp$B = Object.prototype.hasOwnProperty;
var __propIsEnum$B = Object.prototype.propertyIsEnumerable;
var __defNormalProp$B = (obj, key, value) => key in obj ? __defProp$B(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$B = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$B.call(b, prop))
      __defNormalProp$B(a, prop, b[prop]);
  if (__getOwnPropSymbols$B)
    for (var prop of __getOwnPropSymbols$B(b)) {
      if (__propIsEnum$B.call(b, prop))
        __defNormalProp$B(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$p = (a, b) => __defProps$p(a, __getOwnPropDescs$p(b));
const AdHocCombobox = React.forwardRef(function AdHocCombobox2({ filter, model, isAlwaysWip, handleChangeViewMode, focusOnWipInputRef, populateInputOnEdit }, parentRef) {
  var _a, _b, _c, _d;
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState([]);
  const [optionsLoading, setOptionsLoading] = React.useState(false);
  const [optionsError, setOptionsError] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(null);
  const [filterInputType, setInputType] = React.useState(!isAlwaysWip ? "value" : "key");
  const [preventFiltering, setPreventFiltering] = React.useState(!isAlwaysWip && filterInputType === "value");
  const styles = ui.useStyles2(getStyles$c);
  const [filterMultiValues, setFilterMultiValues] = React.useState([]);
  const [_, setForceRefresh] = React.useState({});
  const allowCustomValue = (_a = model.state.allowCustomValue) != null ? _a : true;
  const multiValuePillWrapperRef = React.useRef(null);
  const hasMultiValueOperator = isMultiValueOperator((filter == null ? void 0 : filter.operator) || "");
  const isMultiValueEdit = hasMultiValueOperator && filterInputType === "value";
  const operatorIdentifier = React.useId();
  const listRef = React.useRef([]);
  const disabledIndicesRef = React.useRef([]);
  const filterInputTypeRef = React.useRef(!isAlwaysWip ? "value" : "key");
  const optionsSearcher = React.useMemo(() => fuzzySearchOptions(options), [options]);
  const isLastFilter = React.useMemo(() => {
    if (isAlwaysWip) {
      return false;
    }
    if (model.state.filters.at(-1) === filter) {
      return true;
    }
    return false;
  }, [filter, isAlwaysWip, model.state.filters]);
  const handleResetWip = React.useCallback(() => {
    if (isAlwaysWip) {
      model._addWip();
      setInputType("key");
      setInputValue("");
    }
  }, [model, isAlwaysWip]);
  const handleMultiValueFilterCommit = React.useCallback(
    (model2, filter2, filterMultiValues2, preventFocus) => {
      if (filterMultiValues2.length) {
        const valueLabels = [];
        const values = [];
        filterMultiValues2.forEach((item) => {
          var _a2;
          valueLabels.push((_a2 = item.label) != null ? _a2 : item.value);
          values.push(item.value);
        });
        model2._updateFilter(filter2, { valueLabels, values, value: values[0] });
        setFilterMultiValues([]);
      }
      if (!preventFocus) {
        setTimeout(() => {
          var _a2;
          return (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
        });
      }
    },
    []
  );
  const handleLocalMultiValueChange = React.useCallback((selectedItem) => {
    setFilterMultiValues((items) => {
      if (items.some((item) => item.value === selectedItem.value)) {
        return items.filter((item) => item.value !== selectedItem.value);
      }
      return [...items, selectedItem];
    });
  }, []);
  const onOpenChange = React.useCallback(
    (nextOpen, _2, reason) => {
      setOpen(nextOpen);
      if (reason && ["outside-press", "escape-key"].includes(reason)) {
        if (isMultiValueEdit) {
          handleMultiValueFilterCommit(model, filter, filterMultiValues);
        }
        handleResetWip();
        handleChangeViewMode == null ? void 0 : handleChangeViewMode();
      }
    },
    [
      filter,
      filterMultiValues,
      handleChangeViewMode,
      handleMultiValueFilterCommit,
      handleResetWip,
      isMultiValueEdit,
      model
    ]
  );
  const outsidePressIdsToIgnore = React.useMemo(() => {
    return [
      operatorIdentifier,
      ...filterMultiValues.reduce(
        (acc, item, i) => [...acc, `${item.value}-${i}`, `${item.value}-${i}-close-icon`],
        []
      )
    ];
  }, [operatorIdentifier, filterMultiValues]);
  const { refs, floatingStyles, context, getReferenceProps, getFloatingProps, getItemProps } = useFloatingInteractions({
    open,
    onOpenChange,
    activeIndex,
    setActiveIndex,
    outsidePressIdsToIgnore,
    listRef,
    disabledIndicesRef
  });
  React.useImperativeHandle(parentRef, () => () => {
    var _a2;
    return (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
  }, [refs.domReference]);
  function onChange(event) {
    const value = event.target.value;
    setInputValue(value);
    setActiveIndex(0);
    if (preventFiltering) {
      setPreventFiltering(false);
    }
  }
  const handleRemoveMultiValue = React.useCallback(
    (item) => {
      setFilterMultiValues((selected) => selected.filter((option) => option.value !== item.value));
      setTimeout(() => {
        var _a2;
        return (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
      });
    },
    [refs.domReference]
  );
  const filteredDropDownItems = flattenOptionGroups(
    handleOptionGroups(optionsSearcher(preventFiltering ? "" : inputValue, filterInputType))
  );
  if (allowCustomValue && filterInputType !== "operator" && inputValue) {
    filteredDropDownItems.push({
      value: inputValue.trim(),
      label: inputValue.trim(),
      isCustom: true
    });
  }
  const maxOptionWidth = setupDropdownAccessibility(filteredDropDownItems, listRef, disabledIndicesRef);
  const handleFetchOptions = React.useCallback(
    async (inputType) => {
      var _a2;
      setOptionsError(false);
      setOptionsLoading(true);
      setOptions([]);
      let options2 = [];
      try {
        if (inputType === "key") {
          options2 = await model._getKeys(null);
        } else if (inputType === "operator") {
          options2 = model._getOperators();
        } else if (inputType === "value") {
          options2 = await model._getValuesFor(filter);
        }
        if (filterInputTypeRef.current !== inputType) {
          return;
        }
        setOptions(options2);
        if ((_a2 = options2[0]) == null ? void 0 : _a2.group) {
          setActiveIndex(1);
        } else {
          setActiveIndex(0);
        }
      } catch (e) {
        setOptionsError(true);
      }
      setOptionsLoading(false);
    },
    [filter, model]
  );
  const rowVirtualizer = reactVirtual.useVirtualizer({
    count: filteredDropDownItems.length,
    getScrollElement: () => refs.floating.current,
    estimateSize: (index) => filteredDropDownItems[index].description ? VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION : VIRTUAL_LIST_ITEM_HEIGHT,
    overscan: VIRTUAL_LIST_OVERSCAN
  });
  const handleBackspaceInput = React.useCallback(
    (event, multiValueEdit) => {
      if (event.key === "Backspace" && !inputValue) {
        if (filterInputType === "value") {
          if (multiValueEdit) {
            if (filterMultiValues.length) {
              setFilterMultiValues((items) => {
                const updated = [...items];
                updated.splice(-1, 1);
                return updated;
              });
              return;
            }
          }
          setInputType("operator");
          return;
        }
        focusOnWipInputRef == null ? void 0 : focusOnWipInputRef();
        model._handleComboboxBackspace(filter);
        if (isAlwaysWip) {
          handleResetWip();
        }
      }
    },
    [
      inputValue,
      filterInputType,
      model,
      filter,
      isAlwaysWip,
      filterMultiValues.length,
      handleResetWip,
      focusOnWipInputRef
    ]
  );
  const handleTabInput = React.useCallback(
    (event, multiValueEdit) => {
      var _a2;
      if (event.key === "Tab" && !event.shiftKey) {
        if (multiValueEdit) {
          event.preventDefault();
          handleMultiValueFilterCommit(model, filter, filterMultiValues);
          (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
        }
        handleChangeViewMode == null ? void 0 : handleChangeViewMode();
        handleResetWip();
      }
    },
    [
      filter,
      filterMultiValues,
      handleChangeViewMode,
      handleMultiValueFilterCommit,
      handleResetWip,
      model,
      refs.domReference
    ]
  );
  const handleShiftTabInput = React.useCallback(
    (event, multiValueEdit) => {
      if (event.key === "Tab" && event.shiftKey) {
        if (multiValueEdit) {
          event.preventDefault();
          handleMultiValueFilterCommit(model, filter, filterMultiValues, true);
        }
        handleChangeViewMode == null ? void 0 : handleChangeViewMode();
        handleResetWip();
      }
    },
    [filter, filterMultiValues, handleChangeViewMode, handleMultiValueFilterCommit, handleResetWip, model]
  );
  const handleEnterInput = React.useCallback(
    (event, multiValueEdit) => {
      if (event.key === "Enter" && activeIndex != null) {
        if (!filteredDropDownItems[activeIndex]) {
          return;
        }
        const selectedItem = filteredDropDownItems[activeIndex];
        if (multiValueEdit) {
          handleLocalMultiValueChange(selectedItem);
          setInputValue("");
        } else {
          model._updateFilter(
            filter,
            generateFilterUpdatePayload({
              filterInputType,
              item: selectedItem,
              filter,
              setFilterMultiValues
            })
          );
          populateInputValueOnInputTypeSwitch({
            populateInputOnEdit,
            item: selectedItem,
            filterInputType,
            setInputValue,
            filter
          });
          switchToNextInputType(
            filterInputType,
            setInputType,
            handleChangeViewMode,
            refs.domReference.current,
            isLastFilter ? false : void 0
          );
          setActiveIndex(null);
          if (isLastFilter) {
            focusOnWipInputRef == null ? void 0 : focusOnWipInputRef();
          }
        }
      }
    },
    [
      activeIndex,
      filteredDropDownItems,
      handleLocalMultiValueChange,
      model,
      filter,
      filterInputType,
      populateInputOnEdit,
      handleChangeViewMode,
      refs.domReference,
      isLastFilter,
      focusOnWipInputRef
    ]
  );
  const handleEditMultiValuePill = React.useCallback(
    (value) => {
      var _a2;
      const valueLabel = value.label || value.value;
      setFilterMultiValues((prev) => prev.filter((item) => item.value !== value.value));
      setPreventFiltering(true);
      setInputValue(valueLabel);
      (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
      setTimeout(() => {
        var _a3;
        (_a3 = refs.domReference.current) == null ? void 0 : _a3.select();
      });
    },
    [refs.domReference]
  );
  React.useEffect(() => {
    if (open) {
      handleFetchOptions(filterInputType);
    }
  }, [open, filterInputType]);
  React.useEffect(() => {
    var _a2, _b2;
    if (!isAlwaysWip) {
      if (hasMultiValueOperator && ((_a2 = filter == null ? void 0 : filter.values) == null ? void 0 : _a2.length)) {
        const multiValueOptions = filter.values.reduce(
          (acc, value, i) => {
            var _a3;
            return [
              ...acc,
              {
                label: ((_a3 = filter.valueLabels) == null ? void 0 : _a3[i]) || value,
                value
              }
            ];
          },
          []
        );
        setFilterMultiValues(multiValueOptions);
      }
      if (!hasMultiValueOperator && populateInputOnEdit) {
        setInputValue((filter == null ? void 0 : filter.value) || "");
        setTimeout(() => {
          var _a3;
          (_a3 = refs.domReference.current) == null ? void 0 : _a3.select();
        });
      }
      (_b2 = refs.domReference.current) == null ? void 0 : _b2.focus();
    }
  }, []);
  React.useEffect(() => {
    if (isMultiValueEdit && filterMultiValues) {
      setTimeout(() => setForceRefresh({}));
    }
  }, [filterMultiValues, isMultiValueEdit]);
  React.useLayoutEffect(() => {
    if (filterInputTypeRef.current) {
      filterInputTypeRef.current = filterInputType;
    }
  }, [filterInputType]);
  React.useLayoutEffect(() => {
    var _a2, _b2;
    if (activeIndex !== null && rowVirtualizer.range && (activeIndex > ((_a2 = rowVirtualizer.range) == null ? void 0 : _a2.endIndex) || activeIndex < ((_b2 = rowVirtualizer.range) == null ? void 0 : _b2.startIndex))) {
      rowVirtualizer.scrollToIndex(activeIndex);
    }
  }, [activeIndex, rowVirtualizer]);
  const keyLabel = (_b = filter == null ? void 0 : filter.keyLabel) != null ? _b : filter == null ? void 0 : filter.key;
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.comboboxWrapper
  }, filter ? /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.pillWrapper
  }, (filter == null ? void 0 : filter.key) ? /* @__PURE__ */ React__default["default"].createElement("div", {
    className: css.cx(styles.basePill, styles.keyPill)
  }, keyLabel) : null, (filter == null ? void 0 : filter.key) && (filter == null ? void 0 : filter.operator) && filterInputType !== "operator" ? /* @__PURE__ */ React__default["default"].createElement("div", {
    id: operatorIdentifier,
    className: css.cx(styles.basePill, styles.operatorPill, operatorIdentifier),
    role: "button",
    "aria-label": "Edit filter operator",
    tabIndex: 0,
    onClick: (event) => {
      event.stopPropagation();
      setInputValue("");
      switchInputType("operator", setInputType, void 0, refs.domReference.current);
    },
    onKeyDown: (event) => {
      handleShiftTabInput(event, hasMultiValueOperator);
      if (event.key === "Enter") {
        setInputValue("");
        switchInputType("operator", setInputType, void 0, refs.domReference.current);
      }
    }
  }, filter.operator) : null, /* @__PURE__ */ React__default["default"].createElement("div", {
    ref: multiValuePillWrapperRef
  }), isMultiValueEdit ? filterMultiValues.map((item, i) => /* @__PURE__ */ React__default["default"].createElement(MultiValuePill, {
    key: `${item.value}-${i}`,
    item,
    index: i,
    handleRemoveMultiValue,
    handleEditMultiValuePill
  })) : null) : null, /* @__PURE__ */ React__default["default"].createElement("input", __spreadProps$p(__spreadValues$B({}, getReferenceProps({
    ref: refs.setReference,
    onChange,
    value: inputValue,
    placeholder: generatePlaceholder(filter, filterInputType, isMultiValueEdit, isAlwaysWip),
    "aria-autocomplete": "list",
    onKeyDown(event) {
      if (!open) {
        setOpen(true);
        return;
      }
      if (filterInputType === "operator") {
        handleShiftTabInput(event);
      }
      handleBackspaceInput(event, isMultiValueEdit);
      handleTabInput(event, isMultiValueEdit);
      handleEnterInput(event, isMultiValueEdit);
    }
  })), {
    className: css.cx(styles.inputStyle, { [styles.loadingInputPadding]: !optionsLoading }),
    onClick: (event) => {
      event.stopPropagation();
      setOpen(true);
    },
    onFocus: () => {
      setOpen(true);
    }
  })), optionsLoading ? /* @__PURE__ */ React__default["default"].createElement(ui.Spinner, {
    className: styles.loadingIndicator,
    inline: true
  }) : null, /* @__PURE__ */ React__default["default"].createElement(react.FloatingPortal, null, open && /* @__PURE__ */ React__default["default"].createElement(react.FloatingFocusManager, {
    context,
    initialFocus: -1,
    visuallyHiddenDismiss: true,
    modal: false
  }, /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, /* @__PURE__ */ React__default["default"].createElement("div", {
    style: __spreadProps$p(__spreadValues$B({}, floatingStyles), {
      width: `${optionsError ? ERROR_STATE_DROPDOWN_WIDTH : maxOptionWidth}px`,
      transform: isMultiValueEdit ? `translate(${((_c = multiValuePillWrapperRef.current) == null ? void 0 : _c.getBoundingClientRect().left) || 0}px, ${(((_d = refs.domReference.current) == null ? void 0 : _d.getBoundingClientRect().bottom) || 0) + 10}px )` : floatingStyles.transform
    }),
    ref: refs.setFloating,
    className: styles.dropdownWrapper,
    tabIndex: -1
  }, /* @__PURE__ */ React__default["default"].createElement("div", __spreadProps$p(__spreadValues$B({
    style: {
      height: `${rowVirtualizer.getTotalSize() || VIRTUAL_LIST_ITEM_HEIGHT}px`
    }
  }, getFloatingProps()), {
    tabIndex: -1
  }), optionsLoading ? /* @__PURE__ */ React__default["default"].createElement(LoadingOptionsPlaceholder, null) : optionsError ? /* @__PURE__ */ React__default["default"].createElement(OptionsErrorPlaceholder, {
    handleFetchOptions: () => handleFetchOptions(filterInputType)
  }) : !filteredDropDownItems.length && (!allowCustomValue || filterInputType === "operator" || !inputValue) ? /* @__PURE__ */ React__default["default"].createElement(NoOptionsPlaceholder, null) : rowVirtualizer.getVirtualItems().map((virtualItem) => {
    var _a2;
    const item = filteredDropDownItems[virtualItem.index];
    const index = virtualItem.index;
    if (item.options) {
      return /* @__PURE__ */ React__default["default"].createElement("div", {
        key: `${item.label}+${index}`,
        className: css.cx(styles.optionGroupLabel, styles.groupTopBorder),
        style: {
          height: `${virtualItem.size}px`,
          transform: `translateY(${virtualItem.start}px)`
        }
      }, /* @__PURE__ */ React__default["default"].createElement(ui.Text, {
        weight: "bold",
        variant: "bodySmall",
        color: "secondary"
      }, item.label));
    }
    const nextItem = filteredDropDownItems[virtualItem.index + 1];
    const shouldAddBottomBorder = nextItem && !nextItem.group && !nextItem.options && item.group;
    return /* @__PURE__ */ React__default["default"].createElement(DropdownItem, __spreadProps$p(__spreadValues$B({}, getItemProps({
      key: `${item.value}-${index}`,
      ref(node) {
        listRef.current[index] = node;
      },
      onClick(event) {
        var _a3;
        if (filterInputType !== "value") {
          event.stopPropagation();
        }
        if (isMultiValueEdit) {
          event.preventDefault();
          event.stopPropagation();
          handleLocalMultiValueChange(item);
          setInputValue("");
          (_a3 = refs.domReference.current) == null ? void 0 : _a3.focus();
        } else {
          model._updateFilter(
            filter,
            generateFilterUpdatePayload({
              filterInputType,
              item,
              filter,
              setFilterMultiValues
            })
          );
          populateInputValueOnInputTypeSwitch({
            populateInputOnEdit,
            item,
            filterInputType,
            setInputValue,
            filter
          });
          switchToNextInputType(
            filterInputType,
            setInputType,
            handleChangeViewMode,
            refs.domReference.current,
            false
          );
        }
      }
    })), {
      active: activeIndex === index,
      addGroupBottomBorder: shouldAddBottomBorder,
      style: {
        height: `${virtualItem.size}px`,
        transform: `translateY(${virtualItem.start}px)`
      },
      "aria-setsize": filteredDropDownItems.length,
      "aria-posinset": virtualItem.index + 1,
      isMultiValueEdit,
      checked: filterMultiValues.some((val) => val.value === item.value)
    }), /* @__PURE__ */ React__default["default"].createElement("span", null, item.isCustom ? "Use custom value: " : "", " ", (_a2 = item.label) != null ? _a2 : item.value), item.description ? /* @__PURE__ */ React__default["default"].createElement("div", {
      className: styles.descriptionText
    }, item.description) : null);
  }))), isMultiValueEdit && !optionsLoading && !optionsError && filteredDropDownItems.length ? /* @__PURE__ */ React__default["default"].createElement(MultiValueApplyButton, {
    onApply: () => {
      handleMultiValueFilterCommit(model, filter, filterMultiValues);
    },
    floatingElement: refs.floating.current,
    maxOptionWidth,
    menuHeight: Math.min(rowVirtualizer.getTotalSize(), MAX_MENU_HEIGHT)
  }) : null))));
});
const getStyles$c = (theme) => ({
  comboboxWrapper: css.css({
    display: "flex",
    flexWrap: "wrap"
  }),
  pillWrapper: css.css({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap"
  }),
  basePill: css.css(__spreadProps$p(__spreadValues$B({
    display: "flex",
    alignItems: "center",
    background: theme.colors.action.disabledBackground,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 1, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: "hidden",
    whiteSpace: "nowrap",
    minHeight: theme.spacing(2.75)
  }, theme.typography.bodySmall), {
    cursor: "pointer"
  })),
  keyPill: css.css({
    fontWeight: theme.typography.fontWeightBold,
    cursor: "default"
  }),
  operatorPill: css.css({
    "&:hover": {
      background: theme.colors.action.hover
    }
  }),
  dropdownWrapper: css.css({
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.z2,
    overflowY: "auto",
    zIndex: theme.zIndex.dropdown
  }),
  inputStyle: css.css({
    paddingBlock: 0,
    "&:focus": {
      outline: "none"
    }
  }),
  loadingIndicator: css.css({
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing(0.5)
  }),
  loadingInputPadding: css.css({
    paddingRight: theme.spacing(2.5)
  }),
  optionGroupLabel: css.css({
    padding: theme.spacing(1),
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%"
  }),
  groupTopBorder: css.css({
    "&:not(:first-child)": {
      borderTop: `1px solid ${theme.colors.border.weak}`
    }
  }),
  descriptionText: css.css(__spreadProps$p(__spreadValues$B({}, theme.typography.bodySmall), {
    color: theme.colors.text.secondary,
    paddingTop: theme.spacing(0.5)
  }))
});

var __defProp$A = Object.defineProperty;
var __defProps$o = Object.defineProperties;
var __getOwnPropDescs$o = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$A = Object.getOwnPropertySymbols;
var __hasOwnProp$A = Object.prototype.hasOwnProperty;
var __propIsEnum$A = Object.prototype.propertyIsEnumerable;
var __defNormalProp$A = (obj, key, value) => key in obj ? __defProp$A(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$A = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$A.call(b, prop))
      __defNormalProp$A(a, prop, b[prop]);
  if (__getOwnPropSymbols$A)
    for (var prop of __getOwnPropSymbols$A(b)) {
      if (__propIsEnum$A.call(b, prop))
        __defNormalProp$A(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$o = (a, b) => __defProps$o(a, __getOwnPropDescs$o(b));
function AdHocFilterPill({ filter, model, readOnly, focusOnWipInputRef }) {
  var _a, _b, _c;
  const styles = ui.useStyles2(getStyles$b);
  const [viewMode, setViewMode] = React.useState(true);
  const [shouldFocusOnPillWrapper, setShouldFocusOnPillWrapper] = React.useState(false);
  const pillWrapperRef = React.useRef(null);
  const [populateInputOnEdit, setPopulateInputOnEdit] = React.useState(false);
  const keyLabel = (_a = filter.keyLabel) != null ? _a : filter.key;
  const valueLabel = ((_b = filter.valueLabels) == null ? void 0 : _b.join(", ")) || ((_c = filter.values) == null ? void 0 : _c.join(", ")) || filter.value;
  const handleChangeViewMode = React.useCallback(
    (event, shouldFocusOnPillWrapperOverride) => {
      event == null ? void 0 : event.stopPropagation();
      if (readOnly) {
        return;
      }
      setShouldFocusOnPillWrapper(shouldFocusOnPillWrapperOverride != null ? shouldFocusOnPillWrapperOverride : !viewMode);
      setViewMode(!viewMode);
    },
    [readOnly, viewMode]
  );
  React.useEffect(() => {
    var _a2;
    if (shouldFocusOnPillWrapper) {
      (_a2 = pillWrapperRef.current) == null ? void 0 : _a2.focus();
      setShouldFocusOnPillWrapper(false);
    }
  }, [shouldFocusOnPillWrapper]);
  React.useEffect(() => {
    if (filter.forceEdit && viewMode) {
      setViewMode(false);
      model._updateFilter(filter, { forceEdit: void 0 });
    }
  }, [filter, model, viewMode]);
  React.useEffect(() => {
    if (viewMode) {
      setPopulateInputOnEdit((prevValue) => prevValue ? false : prevValue);
    }
  }, [viewMode]);
  if (viewMode) {
    const pillText = /* @__PURE__ */ React__default["default"].createElement("span", {
      className: styles.pillText
    }, keyLabel, " ", filter.operator, " ", valueLabel);
    return /* @__PURE__ */ React__default["default"].createElement("div", {
      className: css.cx(styles.combinedFilterPill, { [styles.readOnlyCombinedFilter]: readOnly }),
      onClick: (e) => {
        e.stopPropagation();
        setPopulateInputOnEdit(true);
        handleChangeViewMode();
      },
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          setPopulateInputOnEdit(true);
          handleChangeViewMode();
        }
      },
      role: "button",
      "aria-label": `Edit filter with key ${keyLabel}`,
      tabIndex: 0,
      ref: pillWrapperRef
    }, valueLabel.length < 20 ? pillText : /* @__PURE__ */ React__default["default"].createElement(ui.Tooltip, {
      content: /* @__PURE__ */ React__default["default"].createElement("div", {
        className: styles.tooltipText
      }, valueLabel),
      placement: "top"
    }, pillText), !readOnly ? /* @__PURE__ */ React__default["default"].createElement(ui.IconButton, {
      onClick: (e) => {
        e.stopPropagation();
        model._removeFilter(filter);
        setTimeout(() => focusOnWipInputRef == null ? void 0 : focusOnWipInputRef());
      },
      onKeyDownCapture: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          model._removeFilter(filter);
          setTimeout(() => focusOnWipInputRef == null ? void 0 : focusOnWipInputRef());
        }
      },
      name: "times",
      size: "md",
      className: styles.removeButton,
      tooltip: `Remove filter with key ${keyLabel}`
    }) : null);
  }
  return /* @__PURE__ */ React__default["default"].createElement(AdHocCombobox, {
    filter,
    model,
    handleChangeViewMode,
    focusOnWipInputRef,
    populateInputOnEdit
  });
}
const getStyles$b = (theme) => ({
  combinedFilterPill: css.css(__spreadProps$o(__spreadValues$A({
    display: "flex",
    alignItems: "center",
    background: theme.colors.action.selected,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 0, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: "hidden",
    whiteSpace: "nowrap",
    minHeight: theme.spacing(2.75)
  }, theme.typography.bodySmall), {
    fontWeight: theme.typography.fontWeightBold,
    cursor: "pointer",
    "&:hover": {
      background: theme.colors.action.hover
    }
  })),
  readOnlyCombinedFilter: css.css({
    paddingRight: theme.spacing(1),
    cursor: "text",
    "&:hover": {
      background: theme.colors.action.selected
    }
  }),
  removeButton: css.css({
    marginInline: theme.spacing(0.5),
    cursor: "pointer",
    "&:hover": {
      color: theme.colors.text.primary
    }
  }),
  pillText: css.css({
    maxWidth: "200px",
    width: "100%",
    textOverflow: "ellipsis",
    overflow: "hidden"
  }),
  tooltipText: css.css({
    textAlign: "center"
  })
});

const AdHocFiltersAlwaysWipCombobox = React.forwardRef(function AdHocFiltersAlwaysWipCombobox2({ model }, parentRef) {
  const { _wip } = model.useState();
  React.useLayoutEffect(() => {
    if (!_wip) {
      model._addWip();
    }
  }, [_wip]);
  return /* @__PURE__ */ React__default["default"].createElement(AdHocCombobox, {
    model,
    filter: _wip,
    isAlwaysWip: true,
    ref: parentRef
  });
});

const AdHocFiltersComboboxRenderer = React.memo(function AdHocFiltersComboboxRenderer2({ model }) {
  const { filters, readOnly } = model.useState();
  const styles = ui.useStyles2(getStyles$a);
  const focusOnWipInputRef = React.useRef();
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: css.cx(styles.comboboxWrapper, { [styles.comboboxFocusOutline]: !readOnly }),
    onClick: () => {
      var _a;
      (_a = focusOnWipInputRef.current) == null ? void 0 : _a.call(focusOnWipInputRef);
    }
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
    name: "filter",
    className: styles.filterIcon,
    size: "lg"
  }), filters.map((filter, index) => /* @__PURE__ */ React__default["default"].createElement(AdHocFilterPill, {
    key: `${index}-${filter.key}`,
    filter,
    model,
    readOnly,
    focusOnWipInputRef: focusOnWipInputRef.current
  })), !readOnly ? /* @__PURE__ */ React__default["default"].createElement(AdHocFiltersAlwaysWipCombobox, {
    model,
    ref: focusOnWipInputRef
  }) : null);
});
const getStyles$a = (theme) => ({
  comboboxWrapper: css.css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(0.5),
    minHeight: theme.spacing(4),
    backgroundColor: theme.components.input.background,
    border: `1px solid ${theme.colors.border.strong}`,
    borderRadius: theme.shape.radius.default,
    paddingInline: theme.spacing(1),
    paddingBlock: theme.spacing(0.5),
    flexGrow: 1
  }),
  comboboxFocusOutline: css.css({
    "&:focus-within": {
      outline: "2px dotted transparent",
      outlineOffset: "2px",
      boxShadow: `0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main}`,
      transitionTimingFunction: `cubic-bezier(0.19, 1, 0.22, 1)`,
      transitionDuration: "0.2s",
      transitionProperty: "outline, outline-offset, box-shadow",
      zIndex: 2
    }
  }),
  filterIcon: css.css({
    color: theme.colors.text.secondary,
    alignSelf: "center"
  })
});

var __defProp$z = Object.defineProperty;
var __defProps$n = Object.defineProperties;
var __getOwnPropDescs$n = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$z = Object.getOwnPropertySymbols;
var __hasOwnProp$z = Object.prototype.hasOwnProperty;
var __propIsEnum$z = Object.prototype.propertyIsEnumerable;
var __defNormalProp$z = (obj, key, value) => key in obj ? __defProp$z(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$z = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$z.call(b, prop))
      __defNormalProp$z(a, prop, b[prop]);
  if (__getOwnPropSymbols$z)
    for (var prop of __getOwnPropSymbols$z(b)) {
      if (__propIsEnum$z.call(b, prop))
        __defNormalProp$z(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$n = (a, b) => __defProps$n(a, __getOwnPropDescs$n(b));
const OPERATORS = [
  {
    value: "=",
    description: "Equals"
  },
  {
    value: "!=",
    description: "Not equal"
  },
  {
    value: "=|",
    description: "One of. Use to filter on multiple values.",
    isMulti: true
  },
  {
    value: "!=|",
    description: "Not one of. Use to exclude multiple values.",
    isMulti: true
  },
  {
    value: "=~",
    description: "Matches regex"
  },
  {
    value: "!~",
    description: "Does not match regex"
  },
  {
    value: "<",
    description: "Less than"
  },
  {
    value: ">",
    description: "Greater than"
  }
];
class AdHocFiltersVariable extends SceneObjectBase {
  constructor(state) {
    var _a, _b;
    super(__spreadValues$z({
      type: "adhoc",
      name: (_a = state.name) != null ? _a : "Filters",
      filters: [],
      datasource: null,
      applyMode: "auto",
      filterExpression: (_b = state.filterExpression) != null ? _b : renderExpression(state.expressionBuilder, state.filters)
    }, state));
    this._scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };
    this._dataSourceSrv = runtime.getDataSourceSrv();
    this._urlSync = new AdHocFiltersVariableUrlSyncHandler(this);
    if (this.state.applyMode === "auto") {
      patchGetAdhocFilters(this);
    }
  }
  setState(update) {
    let filterExpressionChanged = false;
    if (update.filters && update.filters !== this.state.filters && !update.filterExpression) {
      update.filterExpression = renderExpression(this.state.expressionBuilder, update.filters);
      filterExpressionChanged = update.filterExpression !== this.state.filterExpression;
    }
    super.setState(update);
    if (filterExpressionChanged) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
  updateFilters(filters, options) {
    let filterExpressionChanged = false;
    let filterExpression = void 0;
    if (filters && filters !== this.state.filters) {
      filterExpression = renderExpression(this.state.expressionBuilder, filters);
      filterExpressionChanged = filterExpression !== this.state.filterExpression;
    }
    super.setState({
      filters,
      filterExpression
    });
    if (filterExpressionChanged && (options == null ? void 0 : options.skipPublish) !== true || (options == null ? void 0 : options.forcePublish)) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
  getValue() {
    return this.state.filterExpression;
  }
  _updateFilter(filter, update) {
    const { filters, _wip } = this.state;
    if (filter === _wip) {
      if ("value" in update && update["value"] !== "") {
        this.setState({ filters: [...filters, __spreadValues$z(__spreadValues$z({}, _wip), update)], _wip: void 0 });
      } else {
        this.setState({ _wip: __spreadValues$z(__spreadValues$z({}, filter), update) });
      }
      return;
    }
    const updatedFilters = this.state.filters.map((f) => {
      return f === filter ? __spreadValues$z(__spreadValues$z({}, f), update) : f;
    });
    this.setState({ filters: updatedFilters });
  }
  _removeFilter(filter) {
    if (filter === this.state._wip) {
      this.setState({ _wip: void 0 });
      return;
    }
    this.setState({ filters: this.state.filters.filter((f) => f !== filter) });
  }
  _removeLastFilter() {
    const filterToRemove = this.state.filters.at(-1);
    if (filterToRemove) {
      this._removeFilter(filterToRemove);
    }
  }
  _handleComboboxBackspace(filter) {
    if (this.state.filters.length) {
      let filterToForceIndex = this.state.filters.length - 1;
      if (filter !== this.state._wip) {
        filterToForceIndex = -1;
      }
      this.setState({
        filters: this.state.filters.reduce((acc, f, index) => {
          if (index === filterToForceIndex) {
            return [
              ...acc,
              __spreadProps$n(__spreadValues$z({}, f), {
                forceEdit: true
              })
            ];
          }
          if (f === filter) {
            return acc;
          }
          return [...acc, f];
        }, [])
      });
    }
  }
  async _getKeys(currentKey) {
    var _a, _b, _c;
    const override = await ((_b = (_a = this.state).getTagKeysProvider) == null ? void 0 : _b.call(_a, this, currentKey));
    if (override && override.replace) {
      return dataFromResponse(override.values).map(toSelectableValue);
    }
    if (this.state.defaultKeys) {
      return this.state.defaultKeys.map(toSelectableValue);
    }
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagKeys) {
      return [];
    }
    const otherFilters = this.state.filters.filter((f) => f.key !== currentKey).concat((_c = this.state.baseFilters) != null ? _c : []);
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : void 0;
    const response = await ds.getTagKeys(__spreadValues$z({
      filters: otherFilters,
      queries,
      timeRange
    }, getEnrichedFiltersRequest(this)));
    if (responseHasError(response)) {
      this.setState({ error: response.error.message });
    }
    let keys = dataFromResponse(response);
    if (override) {
      keys = keys.concat(dataFromResponse(override.values));
    }
    const tagKeyRegexFilter = this.state.tagKeyRegexFilter;
    if (tagKeyRegexFilter) {
      keys = keys.filter((f) => f.text.match(tagKeyRegexFilter));
    }
    return keys.map(toSelectableValue);
  }
  async _getValuesFor(filter) {
    var _a, _b, _c;
    const override = await ((_b = (_a = this.state).getTagValuesProvider) == null ? void 0 : _b.call(_a, this, filter));
    if (override && override.replace) {
      return dataFromResponse(override.values).map(toSelectableValue);
    }
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagValues) {
      return [];
    }
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat((_c = this.state.baseFilters) != null ? _c : []);
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : void 0;
    const response = await ds.getTagValues(__spreadValues$z({
      key: filter.key,
      filters: otherFilters,
      timeRange,
      queries
    }, getEnrichedFiltersRequest(this)));
    if (responseHasError(response)) {
      this.setState({ error: response.error.message });
    }
    let values = dataFromResponse(response);
    if (override) {
      values = values.concat(dataFromResponse(override.values));
    }
    return values.map(toSelectableValue);
  }
  _addWip() {
    this.setState({
      _wip: { key: "", value: "", operator: "=", condition: "" }
    });
  }
  _getOperators() {
    const filteredOperators = this.state.supportsMultiValueOperators ? OPERATORS : OPERATORS.filter((operator) => !operator.isMulti);
    return filteredOperators.map(({ value, description }) => ({
      label: value,
      value,
      description
    }));
  }
}
AdHocFiltersVariable.Component = AdHocFiltersVariableRenderer;
function renderExpression(builder, filters) {
  return (builder != null ? builder : renderPrometheusLabelFilters)(filters != null ? filters : []);
}
function AdHocFiltersVariableRenderer({ model }) {
  const { filters, readOnly, addFilterButtonText } = model.useState();
  const styles = ui.useStyles2(getStyles$9);
  if (model.state.layout === "combobox") {
    return /* @__PURE__ */ React__default["default"].createElement(AdHocFiltersComboboxRenderer, {
      model
    });
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.wrapper
  }, filters.map((filter, index) => /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, {
    key: index
  }, /* @__PURE__ */ React__default["default"].createElement(AdHocFilterRenderer, {
    filter,
    model
  }))), !readOnly && /* @__PURE__ */ React__default["default"].createElement(AdHocFilterBuilder, {
    model,
    key: "'builder",
    addFilterButtonText
  }));
}
const getStyles$9 = (theme) => ({
  wrapper: css.css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(1)
  })
});
function toSelectableValue(input) {
  const { text, value } = input;
  const result = {
    label: text,
    value: String(value != null ? value : text)
  };
  if ("group" in input) {
    result.group = input.group;
  }
  return result;
}
function isFilterComplete(filter) {
  return filter.key !== "" && filter.operator !== "" && filter.value !== "";
}
function isMultiValueOperator(operatorValue) {
  const operator = OPERATORS.find((o) => o.value === operatorValue);
  if (!operator) {
    return false;
  }
  return Boolean(operator.isMulti);
}

class DataLayersMerger {
  constructor() {
    this._resultsMap = /* @__PURE__ */ new Map();
    this._prevLayers = [];
  }
  getMergedStream(layers) {
    if (areDifferentLayers(layers, this._prevLayers)) {
      this._resultsMap = /* @__PURE__ */ new Map();
      this._prevLayers = layers;
    }
    const resultStreams = layers.map((l) => l.getResultsStream());
    const deactivationHandlers = [];
    for (const layer of layers) {
      deactivationHandlers.push(layer.activate());
    }
    return rxjs.merge(resultStreams).pipe(
      rxjs.mergeAll(),
      rxjs.filter((v) => {
        return this._resultsMap.get(v.origin.state.key) !== v;
      }),
      rxjs.map((v) => {
        this._resultsMap.set(v.origin.state.key, v);
        return this._resultsMap.values();
      }),
      rxjs.finalize(() => {
        deactivationHandlers.forEach((handler) => handler());
      })
    );
  }
}
function areDifferentLayers(a, b) {
  if (a.length !== b.length) {
    return true;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return true;
    }
  }
  return false;
}

var __defProp$y = Object.defineProperty;
var __defProps$m = Object.defineProperties;
var __getOwnPropDescs$m = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$y = Object.getOwnPropertySymbols;
var __hasOwnProp$y = Object.prototype.hasOwnProperty;
var __propIsEnum$y = Object.prototype.propertyIsEnumerable;
var __defNormalProp$y = (obj, key, value) => key in obj ? __defProp$y(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$y = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$y.call(b, prop))
      __defNormalProp$y(a, prop, b[prop]);
  if (__getOwnPropSymbols$y)
    for (var prop of __getOwnPropSymbols$y(b)) {
      if (__propIsEnum$y.call(b, prop))
        __defNormalProp$y(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$m = (a, b) => __defProps$m(a, __getOwnPropDescs$m(b));
let counter$1 = 100;
function getNextRequestId$1() {
  return "SQR" + counter$1++;
}
class SceneQueryRunner extends SceneObjectBase {
  constructor(initialState) {
    super(initialState);
    this._dataLayersMerger = new DataLayersMerger();
    this._variableValueRecorder = new VariableValueRecorder();
    this._results = new rxjs.ReplaySubject(1);
    this._scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["queries", "datasource"],
      onVariableUpdateCompleted: this.onVariableUpdatesCompleted.bind(this),
      onAnyVariableChanged: this.onAnyVariableChanged.bind(this)
    });
    this.onDataReceived = (data$1) => {
      const preProcessedData = data.preProcessPanelData(data$1, this.state.data);
      this._resultAnnotations = data$1.annotations;
      const dataWithLayersApplied = this._combineDataLayers(preProcessedData);
      let hasFetchedData = this.state._hasFetchedData;
      if (!hasFetchedData && preProcessedData.state !== schema.LoadingState.Loading) {
        hasFetchedData = true;
      }
      this.setState({ data: dataWithLayersApplied, _hasFetchedData: hasFetchedData });
      this._results.next({ origin: this, data: dataWithLayersApplied });
    };
    this.addActivationHandler(() => this._onActivate());
  }
  getResultsStream() {
    return this._results;
  }
  _onActivate() {
    if (this.isQueryModeAuto()) {
      const timeRange = sceneGraph.getTimeRange(this);
      const providers = this.getClosestExtraQueryProviders();
      for (const provider of providers) {
        this._subs.add(
          provider.subscribeToState((n, p) => {
            if (provider.shouldRerun(p, n, this.state.queries)) {
              this.runQueries();
            }
          })
        );
      }
      this.subscribeToTimeRangeChanges(timeRange);
      if (this.shouldRunQueriesOnActivate()) {
        this.runQueries();
      }
    }
    if (!this._dataLayersSub) {
      this._handleDataLayers();
    }
    return () => this._onDeactivate();
  }
  _handleDataLayers() {
    const dataLayers = sceneGraph.getDataLayers(this);
    if (dataLayers.length === 0) {
      return;
    }
    this._dataLayersSub = this._dataLayersMerger.getMergedStream(dataLayers).subscribe(this._onLayersReceived.bind(this));
  }
  _onLayersReceived(results) {
    var _a, _b, _c, _d, _e;
    const timeRange = sceneGraph.getTimeRange(this);
    const { dataLayerFilter } = this.state;
    let annotations = [];
    let alertStates = [];
    let alertState;
    for (const result of results) {
      for (let frame of result.data.series) {
        if (((_a = frame.meta) == null ? void 0 : _a.dataTopic) === data.DataTopic.Annotations) {
          annotations = annotations.concat(frame);
        }
        if (((_b = frame.meta) == null ? void 0 : _b.dataTopic) === data.DataTopic.AlertStates) {
          alertStates = alertStates.concat(frame);
        }
      }
    }
    if (dataLayerFilter == null ? void 0 : dataLayerFilter.panelId) {
      if (annotations.length > 0) {
        annotations = filterAnnotations(annotations, dataLayerFilter);
      }
      if (alertStates.length > 0) {
        for (const frame of alertStates) {
          const frameView = new data.DataFrameView(frame);
          for (const row of frameView) {
            if (row.panelId === dataLayerFilter.panelId) {
              alertState = row;
              break;
            }
          }
        }
      }
    }
    if (allFramesEmpty(annotations) && allFramesEmpty(this._layerAnnotations) && lodash.isEqual(alertState, (_c = this.state.data) == null ? void 0 : _c.alertState)) {
      return;
    }
    this._layerAnnotations = annotations;
    const baseStateUpdate = this.state.data ? this.state.data : __spreadProps$m(__spreadValues$y({}, emptyPanelData), { timeRange: timeRange.state.value });
    this.setState({
      data: __spreadProps$m(__spreadValues$y({}, baseStateUpdate), {
        annotations: [...(_d = this._resultAnnotations) != null ? _d : [], ...annotations],
        alertState: alertState != null ? alertState : (_e = this.state.data) == null ? void 0 : _e.alertState
      })
    });
  }
  onVariableUpdatesCompleted() {
    if (this.isQueryModeAuto()) {
      this.runQueries();
    }
  }
  onAnyVariableChanged(variable) {
    if (this._adhocFiltersVar === variable || this._groupByVar === variable || !this.isQueryModeAuto()) {
      return;
    }
    if (variable instanceof AdHocFiltersVariable && this._isRelevantAutoVariable(variable)) {
      this.runQueries();
    }
    if (variable instanceof GroupByVariable && this._isRelevantAutoVariable(variable)) {
      this.runQueries();
    }
  }
  _isRelevantAutoVariable(variable) {
    var _a, _b;
    const datasource = (_a = this.state.datasource) != null ? _a : findFirstDatasource(this.state.queries);
    return variable.state.applyMode === "auto" && (datasource == null ? void 0 : datasource.uid) === ((_b = variable.state.datasource) == null ? void 0 : _b.uid);
  }
  shouldRunQueriesOnActivate() {
    if (this._variableValueRecorder.hasDependenciesChanged(this)) {
      writeSceneLog(
        "SceneQueryRunner",
        "Variable dependency changed while inactive, shouldRunQueriesOnActivate returns true"
      );
      return true;
    }
    if (!this.state.data) {
      return true;
    }
    if (this._isDataTimeRangeStale(this.state.data)) {
      return true;
    }
    return false;
  }
  _isDataTimeRangeStale(data) {
    const timeRange = sceneGraph.getTimeRange(this);
    const stateTimeRange = timeRange.state.value;
    const dataTimeRange = data.timeRange;
    if (stateTimeRange.from.unix() === dataTimeRange.from.unix() && stateTimeRange.to.unix() === dataTimeRange.to.unix()) {
      return false;
    }
    writeSceneLog("SceneQueryRunner", "Data time range is stale");
    return true;
  }
  _onDeactivate() {
    var _a;
    if (this._querySub) {
      this._querySub.unsubscribe();
      this._querySub = void 0;
    }
    if (this._dataLayersSub) {
      this._dataLayersSub.unsubscribe();
      this._dataLayersSub = void 0;
    }
    (_a = this._timeSub) == null ? void 0 : _a.unsubscribe();
    this._timeSub = void 0;
    this._timeSubRange = void 0;
    this._adhocFiltersVar = void 0;
    this._groupByVar = void 0;
    this._variableValueRecorder.recordCurrentDependencyValuesForSceneObject(this);
  }
  setContainerWidth(width) {
    if (!this._containerWidth && width > 0) {
      this._containerWidth = width;
      if (this.state.maxDataPointsFromWidth && !this.state.maxDataPoints) {
        setTimeout(() => {
          if (this.isActive && !this.state._hasFetchedData) {
            this.runQueries();
          }
        }, 0);
      }
    } else {
      if (width > 0) {
        this._containerWidth = width;
      }
    }
  }
  isDataReadyToDisplay() {
    return Boolean(this.state._hasFetchedData);
  }
  subscribeToTimeRangeChanges(timeRange) {
    if (this._timeSubRange === timeRange) {
      return;
    }
    if (this._timeSub) {
      this._timeSub.unsubscribe();
    }
    this._timeSubRange = timeRange;
    this._timeSub = timeRange.subscribeToState(() => {
      this.runWithTimeRange(timeRange);
    });
  }
  runQueries() {
    const timeRange = sceneGraph.getTimeRange(this);
    if (this.isQueryModeAuto()) {
      this.subscribeToTimeRangeChanges(timeRange);
    }
    this.runWithTimeRange(timeRange);
  }
  getMaxDataPoints() {
    var _a;
    if (this.state.maxDataPoints) {
      return this.state.maxDataPoints;
    }
    return this.state.maxDataPointsFromWidth ? (_a = this._containerWidth) != null ? _a : 500 : 500;
  }
  cancelQuery() {
    var _a;
    (_a = this._querySub) == null ? void 0 : _a.unsubscribe();
    if (this._dataLayersSub) {
      this._dataLayersSub.unsubscribe();
      this._dataLayersSub = void 0;
    }
    this.setState({
      data: __spreadProps$m(__spreadValues$y({}, this.state.data), { state: schema.LoadingState.Done })
    });
  }
  async runWithTimeRange(timeRange) {
    var _a, _b, _c;
    if (!this.state.maxDataPoints && this.state.maxDataPointsFromWidth && !this._containerWidth) {
      return;
    }
    if (!this._dataLayersSub) {
      this._handleDataLayers();
    }
    (_a = this._querySub) == null ? void 0 : _a.unsubscribe();
    if (this._variableDependency.hasDependencyInLoadingState()) {
      writeSceneLog("SceneQueryRunner", "Variable dependency is in loading state, skipping query execution");
      this.setState({ data: __spreadProps$m(__spreadValues$y({}, (_b = this.state.data) != null ? _b : emptyPanelData), { state: schema.LoadingState.Loading }) });
      return;
    }
    const { queries } = this.state;
    if (!(queries == null ? void 0 : queries.length)) {
      this._setNoDataState();
      return;
    }
    try {
      const datasource = (_c = this.state.datasource) != null ? _c : findFirstDatasource(queries);
      const ds = await getDataSource(datasource, this._scopedVars);
      this.findAndSubscribeToAdHocFilters(ds.uid);
      const runRequest = runtime.getRunRequest();
      const { primary, secondaries, processors } = this.prepareRequests(timeRange, ds);
      writeSceneLog("SceneQueryRunner", "Starting runRequest", this.state.key);
      let stream = runRequest(ds, primary);
      if (secondaries.length > 0) {
        const secondaryStreams = secondaries.map((r) => runRequest(ds, r));
        const op = extraQueryProcessingOperator(processors);
        stream = rxjs.forkJoin([stream, ...secondaryStreams]).pipe(op);
      }
      stream = stream.pipe(
        registerQueryWithController({
          type: "data",
          request: primary,
          origin: this,
          cancel: () => this.cancelQuery()
        })
      );
      this._querySub = stream.subscribe(this.onDataReceived);
    } catch (err) {
      console.error("PanelQueryRunner Error", err);
      this.onDataReceived(__spreadProps$m(__spreadValues$y(__spreadValues$y({}, emptyPanelData), this.state.data), {
        state: schema.LoadingState.Error,
        errors: [runtime.toDataQueryError(err)]
      }));
    }
  }
  clone(withState) {
    var _a;
    const clone = super.clone(withState);
    if (this._resultAnnotations) {
      clone["_resultAnnotations"] = this._resultAnnotations.map((frame) => __spreadValues$y({}, frame));
    }
    if (this._layerAnnotations) {
      clone["_layerAnnotations"] = this._layerAnnotations.map((frame) => __spreadValues$y({}, frame));
    }
    clone["_variableValueRecorder"] = this._variableValueRecorder.cloneAndRecordCurrentValuesForSceneObject(this);
    clone["_containerWidth"] = this._containerWidth;
    clone["_results"].next({ origin: this, data: (_a = this.state.data) != null ? _a : emptyPanelData });
    return clone;
  }
  prepareRequests(timeRange, ds) {
    var _a;
    const { minInterval, queries } = this.state;
    let request = __spreadValues$y({
      app: "scenes",
      requestId: getNextRequestId$1(),
      timezone: timeRange.getTimeZone(),
      range: timeRange.state.value,
      interval: "1s",
      intervalMs: 1e3,
      targets: lodash.cloneDeep(queries),
      maxDataPoints: this.getMaxDataPoints(),
      scopedVars: this._scopedVars,
      startTime: Date.now(),
      liveStreaming: this.state.liveStreaming,
      rangeRaw: {
        from: timeRange.state.from,
        to: timeRange.state.to
      },
      cacheTimeout: this.state.cacheTimeout,
      queryCachingTTL: this.state.queryCachingTTL
    }, getEnrichedDataRequest(this));
    if (this._adhocFiltersVar) {
      request.filters = this._adhocFiltersVar.state.filters.filter(isFilterComplete);
    }
    if (this._groupByVar) {
      request.groupByKeys = this._groupByVar.state.value;
    }
    request.targets = request.targets.map((query) => {
      var _a2;
      if (!query.datasource || query.datasource.uid !== ds.uid && !((_a2 = ds.meta) == null ? void 0 : _a2.mixed) && runtime.isExpressionReference && !runtime.isExpressionReference(query.datasource)) {
        query.datasource = ds.getRef();
      }
      return query;
    });
    const lowerIntervalLimit = minInterval ? interpolate(this, minInterval) : ds.interval;
    const norm = data.rangeUtil.calculateInterval(timeRange.state.value, request.maxDataPoints, lowerIntervalLimit);
    request.scopedVars = Object.assign({}, request.scopedVars, {
      __interval: { text: norm.interval, value: norm.interval },
      __interval_ms: { text: norm.intervalMs.toString(), value: norm.intervalMs }
    });
    request.interval = norm.interval;
    request.intervalMs = norm.intervalMs;
    const primaryTimeRange = timeRange.state.value;
    let secondaryRequests = [];
    let secondaryProcessors = /* @__PURE__ */ new Map();
    for (const provider of (_a = this.getClosestExtraQueryProviders()) != null ? _a : []) {
      for (const { req, processor } of provider.getExtraQueries(request)) {
        const requestId = getNextRequestId$1();
        secondaryRequests.push(__spreadProps$m(__spreadValues$y({}, req), { requestId }));
        secondaryProcessors.set(requestId, processor != null ? processor : passthroughProcessor);
      }
    }
    request.range = primaryTimeRange;
    return { primary: request, secondaries: secondaryRequests, processors: secondaryProcessors };
  }
  _combineDataLayers(data) {
    if (this._layerAnnotations && this._layerAnnotations.length > 0) {
      data.annotations = (data.annotations || []).concat(this._layerAnnotations);
    }
    if (this.state.data && this.state.data.alertState) {
      data.alertState = this.state.data.alertState;
    }
    return data;
  }
  _setNoDataState() {
    if (this.state.data !== emptyPanelData) {
      this.setState({ data: emptyPanelData });
    }
  }
  getClosestExtraQueryProviders() {
    const found = /* @__PURE__ */ new Map();
    if (!this.parent) {
      return [];
    }
    getClosest(this.parent, (s) => {
      if (isExtraQueryProvider(s) && !found.has(s.constructor)) {
        found.set(s.constructor, s);
      }
      s.forEachChild((child) => {
        if (isExtraQueryProvider(child) && !found.has(child.constructor)) {
          found.set(child.constructor, child);
        }
      });
      return null;
    });
    return Array.from(found.values());
  }
  findAndSubscribeToAdHocFilters(interpolatedUid) {
    const filtersVar = findActiveAdHocFilterVariableByUid(interpolatedUid);
    if (this._adhocFiltersVar !== filtersVar) {
      this._adhocFiltersVar = filtersVar;
      this._updateExplicitVariableDependencies();
    }
    const groupByVar = findActiveGroupByVariablesByUid(interpolatedUid);
    if (this._groupByVar !== groupByVar) {
      this._groupByVar = groupByVar;
      this._updateExplicitVariableDependencies();
    }
  }
  _updateExplicitVariableDependencies() {
    const explicitDependencies = [];
    if (this._adhocFiltersVar) {
      explicitDependencies.push(this._adhocFiltersVar.state.name);
    }
    if (this._groupByVar) {
      explicitDependencies.push(this._groupByVar.state.name);
    }
    this._variableDependency.setVariableNames(explicitDependencies);
  }
  isQueryModeAuto() {
    var _a;
    return ((_a = this.state.runQueriesMode) != null ? _a : "auto") === "auto";
  }
}
function findFirstDatasource(targets) {
  var _a, _b;
  return (_b = (_a = targets.find((t) => t.datasource !== null)) == null ? void 0 : _a.datasource) != null ? _b : void 0;
}
function allFramesEmpty(frames) {
  if (!frames) {
    return true;
  }
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].length > 0) {
      return false;
    }
  }
  return true;
}

function isVariableValueEqual(a, b) {
  if (a === b) {
    return true;
  }
  return lodash.isEqual(a, b);
}
function safeStringifyValue(value) {
  const getCircularReplacer = () => {
    const seen = /* @__PURE__ */ new WeakSet();
    return (_, value2) => {
      if (typeof value2 === "object" && value2 !== null) {
        if (seen.has(value2)) {
          return;
        }
        seen.add(value2);
      }
      return value2;
    };
  };
  try {
    return JSON.stringify(value, getCircularReplacer());
  } catch (error) {
    console.error(error);
  }
  return "";
}
function renderPrometheusLabelFilters(filters) {
  return filters.map((filter) => renderFilter(filter)).join(",");
}
function renderFilter(filter) {
  var _a, _b;
  let value = "";
  let operator = filter.operator;
  if (operator === "=|") {
    operator = "=~";
    value = (_a = filter.values) == null ? void 0 : _a.map(escapeLabelValueInRegexSelector).join("|");
  } else if (operator === "!=|") {
    operator = "!~";
    value = (_b = filter.values) == null ? void 0 : _b.map(escapeLabelValueInRegexSelector).join("|");
  } else if (operator === "=~" || operator === "!~") {
    value = escapeLabelValueInRegexSelector(filter.value);
  } else {
    value = escapeLabelValueInExactSelector(filter.value);
  }
  return `${filter.key}${operator}"${value}"`;
}
function escapeLabelValueInExactSelector(labelValue) {
  return labelValue.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}
function escapeLabelValueInRegexSelector(labelValue) {
  return escapeLabelValueInExactSelector(escapeLokiRegexp(labelValue));
}
const RE2_METACHARACTERS = /[*+?()|\\.\[\]{}^$]/g;
function escapeLokiRegexp(value) {
  return value.replace(RE2_METACHARACTERS, "\\$&");
}
function getQueriesForVariables(sourceObject) {
  var _a;
  const runners = sceneGraph.findAllObjects(
    sourceObject.getRoot(),
    (o) => o instanceof SceneQueryRunner
  );
  const interpolatedDsUuid = sceneGraph.interpolate(sourceObject, (_a = sourceObject.state.datasource) == null ? void 0 : _a.uid);
  const applicableRunners = filterOutInactiveRunnerDuplicates(runners).filter((r) => {
    var _a2;
    const interpolatedQueryDsUuid = sceneGraph.interpolate(sourceObject, (_a2 = r.state.datasource) == null ? void 0 : _a2.uid);
    return interpolatedQueryDsUuid === interpolatedDsUuid;
  });
  if (applicableRunners.length === 0) {
    return [];
  }
  const result = [];
  applicableRunners.forEach((r) => {
    result.push(...r.state.queries);
  });
  return result;
}
function filterOutInactiveRunnerDuplicates(runners) {
  const groupedItems = {};
  for (const item of runners) {
    if (item.state.key) {
      if (!(item.state.key in groupedItems)) {
        groupedItems[item.state.key] = [];
      }
      groupedItems[item.state.key].push(item);
    }
  }
  return Object.values(groupedItems).flatMap((group) => {
    const activeItems = group.filter((item) => item.isActive);
    if (activeItems.length === 0 && group.length === 1) {
      return group;
    }
    return activeItems;
  });
}
function escapeUrlPipeDelimiters(value) {
  if (value === null || value === void 0) {
    return "";
  }
  return value = /\|/g[Symbol.replace](value, "__gfp__");
}
function escapeUrlCommaDelimiters(value) {
  if (value === null || value === void 0) {
    return "";
  }
  return /,/g[Symbol.replace](value, "__gfc__");
}
function unescapeUrlDelimiters(value) {
  if (value === null || value === void 0) {
    return "";
  }
  value = /__gfp__/g[Symbol.replace](value, "|");
  value = /__gfc__/g[Symbol.replace](value, ",");
  return value;
}
function toUrlCommaDelimitedString(key, label) {
  if (!label || key === label) {
    return escapeUrlCommaDelimiters(key);
  }
  return [key, label].map(escapeUrlCommaDelimiters).join(",");
}
function dataFromResponse(response) {
  return Array.isArray(response) ? response : response.data;
}
function responseHasError(response) {
  return !Array.isArray(response) && Boolean(response.error);
}
function handleOptionGroups(values) {
  const result = [];
  const groupedResults = /* @__PURE__ */ new Map();
  for (const value of values) {
    const groupLabel = value.group;
    if (groupLabel) {
      let group = groupedResults.get(groupLabel);
      if (!group) {
        group = [];
        groupedResults.set(groupLabel, group);
        result.push({ label: groupLabel, options: group });
      }
      group.push(value);
    } else {
      result.push(value);
    }
  }
  return result;
}
function getFuzzySearcher(haystack, limit = 1e4) {
  const ufuzzy = new uFuzzy__default["default"]();
  const FIRST = Array.from({ length: Math.min(limit, haystack.length) }, (_, i) => i);
  return (search) => {
    if (search === "") {
      return FIRST;
    }
    const [idxs, info, order] = ufuzzy.search(haystack, search);
    if (idxs) {
      if (info && order) {
        const outIdxs = Array(Math.min(order.length, limit));
        for (let i = 0; i < outIdxs.length; i++) {
          outIdxs[i] = info.idx[order[i]];
        }
        return outIdxs;
      }
      return idxs.slice(0, limit);
    }
    return [];
  };
}

var __defProp$x = Object.defineProperty;
var __defProps$l = Object.defineProperties;
var __getOwnPropDescs$l = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$x = Object.getOwnPropertySymbols;
var __hasOwnProp$x = Object.prototype.hasOwnProperty;
var __propIsEnum$x = Object.prototype.propertyIsEnumerable;
var __defNormalProp$x = (obj, key, value) => key in obj ? __defProp$x(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$x = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$x.call(b, prop))
      __defNormalProp$x(a, prop, b[prop]);
  if (__getOwnPropSymbols$x)
    for (var prop of __getOwnPropSymbols$x(b)) {
      if (__propIsEnum$x.call(b, prop))
        __defNormalProp$x(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$l = (a, b) => __defProps$l(a, __getOwnPropDescs$l(b));
class ConstantVariable extends SceneObjectBase {
  constructor(initialState) {
    super(__spreadProps$l(__spreadValues$x({
      type: "constant",
      value: "",
      name: ""
    }, initialState), {
      skipUrlSync: true
    }));
  }
  getValue() {
    return this.state.value;
  }
}

class VariableDependencyConfig {
  constructor(_sceneObject, _options) {
    this._sceneObject = _sceneObject;
    this._options = _options;
    this._dependencies = /* @__PURE__ */ new Set();
    this._isWaitingForVariables = false;
    this.scanCount = 0;
    this._statePaths = _options.statePaths;
    if (this._options.handleTimeMacros) {
      this.handleTimeMacros();
    }
  }
  hasDependencyOn(name) {
    return this.getNames().has(name);
  }
  variableUpdateCompleted(variable, hasChanged) {
    const deps = this.getNames();
    let dependencyChanged = false;
    if ((deps.has(variable.state.name) || deps.has(data.DataLinkBuiltInVars.includeVars)) && hasChanged) {
      dependencyChanged = true;
    }
    writeSceneLog(
      "VariableDependencyConfig",
      "variableUpdateCompleted",
      variable.state.name,
      dependencyChanged,
      this._isWaitingForVariables
    );
    if (this._options.onAnyVariableChanged) {
      this._options.onAnyVariableChanged(variable);
    }
    if (this._options.onVariableUpdateCompleted && (this._isWaitingForVariables || dependencyChanged)) {
      this._options.onVariableUpdateCompleted();
    }
    if (dependencyChanged) {
      if (this._options.onReferencedVariableValueChanged) {
        this._options.onReferencedVariableValueChanged(variable);
      }
      if (!this._options.onReferencedVariableValueChanged && !this._options.onVariableUpdateCompleted) {
        this._sceneObject.forceRender();
      }
    }
  }
  hasDependencyInLoadingState() {
    if (sceneGraph.hasVariableDependencyInLoadingState(this._sceneObject)) {
      this._isWaitingForVariables = true;
      return true;
    }
    this._isWaitingForVariables = false;
    return false;
  }
  getNames() {
    const prevState = this._state;
    const newState = this._state = this._sceneObject.state;
    if (!prevState) {
      this.scanStateForDependencies(this._state);
      return this._dependencies;
    }
    if (newState !== prevState) {
      if (this._statePaths) {
        for (const path of this._statePaths) {
          if (path === "*" || newState[path] !== prevState[path]) {
            this.scanStateForDependencies(newState);
            break;
          }
        }
      } else {
        this.scanStateForDependencies(newState);
      }
    }
    return this._dependencies;
  }
  setVariableNames(varNames) {
    this._options.variableNames = varNames;
    this.scanStateForDependencies(this._state);
  }
  setPaths(paths) {
    this._statePaths = paths;
  }
  scanStateForDependencies(state) {
    this._dependencies.clear();
    this.scanCount += 1;
    if (this._options.variableNames) {
      for (const name of this._options.variableNames) {
        this._dependencies.add(name);
      }
    }
    if (this._statePaths) {
      for (const path of this._statePaths) {
        if (path === "*") {
          this.extractVariablesFrom(state);
          break;
        } else {
          const value = state[path];
          if (value) {
            this.extractVariablesFrom(value);
          }
        }
      }
    }
  }
  extractVariablesFrom(value) {
    VARIABLE_REGEX.lastIndex = 0;
    const stringToCheck = typeof value !== "string" ? safeStringifyValue(value) : value;
    const matches = stringToCheck.matchAll(VARIABLE_REGEX);
    if (!matches) {
      return;
    }
    for (const match of matches) {
      const [, var1, var2, , var3] = match;
      const variableName = var1 || var2 || var3;
      this._dependencies.add(variableName);
    }
  }
  handleTimeMacros() {
    this._sceneObject.addActivationHandler(() => {
      const timeRange = sceneGraph.getTimeRange(this._sceneObject);
      const sub = timeRange.subscribeToState((newState, oldState) => {
        const deps = this.getNames();
        const hasFromDep = deps.has("__from");
        const hasToDep = deps.has("__to");
        const hasTimeZone = deps.has("__timezone");
        if (newState.value !== oldState.value) {
          if (hasFromDep) {
            const variable = new ConstantVariable({ name: "__from", value: newState.from });
            this.variableUpdateCompleted(variable, true);
          } else if (hasToDep) {
            const variable = new ConstantVariable({ name: "__to", value: newState.to });
            this.variableUpdateCompleted(variable, true);
          }
        }
        if (newState.timeZone !== oldState.timeZone && hasTimeZone) {
          const variable = new ConstantVariable({ name: "__timezone", value: newState.timeZone });
          this.variableUpdateCompleted(variable, true);
        }
      });
      return () => sub.unsubscribe();
    });
  }
}

const hasLegacyVariableSupport = (datasource) => {
  return Boolean(datasource.metricFindQuery) && !Boolean(datasource.variables);
};
const hasStandardVariableSupport = (datasource) => {
  if (!datasource.variables) {
    return false;
  }
  if (datasource.variables.getType() !== data.VariableSupportType.Standard) {
    return false;
  }
  const variableSupport = datasource.variables;
  return "toDataQuery" in variableSupport && Boolean(variableSupport.toDataQuery);
};
const hasCustomVariableSupport = (datasource) => {
  if (!datasource.variables) {
    return false;
  }
  if (datasource.variables.getType() !== data.VariableSupportType.Custom) {
    return false;
  }
  const variableSupport = datasource.variables;
  return "query" in variableSupport && "editor" in variableSupport && Boolean(variableSupport.query) && Boolean(variableSupport.editor);
};
const hasDataSourceVariableSupport = (datasource) => {
  if (!datasource.variables) {
    return false;
  }
  return datasource.variables.getType() === data.VariableSupportType.Datasource;
};

var __defProp$w = Object.defineProperty;
var __defProps$k = Object.defineProperties;
var __getOwnPropDescs$k = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$w = Object.getOwnPropertySymbols;
var __hasOwnProp$w = Object.prototype.hasOwnProperty;
var __propIsEnum$w = Object.prototype.propertyIsEnumerable;
var __defNormalProp$w = (obj, key, value) => key in obj ? __defProp$w(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$w = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$w.call(b, prop))
      __defNormalProp$w(a, prop, b[prop]);
  if (__getOwnPropSymbols$w)
    for (var prop of __getOwnPropSymbols$w(b)) {
      if (__propIsEnum$w.call(b, prop))
        __defNormalProp$w(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$k = (a, b) => __defProps$k(a, __getOwnPropDescs$k(b));
class StandardQueryRunner {
  constructor(datasource, _runRequest = runtime.getRunRequest()) {
    this.datasource = datasource;
    this._runRequest = _runRequest;
  }
  getTarget(variable) {
    if (hasStandardVariableSupport(this.datasource)) {
      return this.datasource.variables.toDataQuery(ensureVariableQueryModelIsADataQuery(variable));
    }
    throw new Error("Couldn't create a target with supplied arguments.");
  }
  runRequest(_, request) {
    if (!hasStandardVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }
    if (!this.datasource.variables.query) {
      return this._runRequest(this.datasource, request);
    }
    return this._runRequest(this.datasource, request, this.datasource.variables.query.bind(this.datasource.variables));
  }
}
class LegacyQueryRunner {
  constructor(datasource) {
    this.datasource = datasource;
  }
  getTarget(variable) {
    if (hasLegacyVariableSupport(this.datasource)) {
      return variable.state.query;
    }
    throw new Error("Couldn't create a target with supplied arguments.");
  }
  runRequest({ variable, searchFilter }, request) {
    if (!hasLegacyVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }
    return rxjs.from(
      this.datasource.metricFindQuery(variable.state.query, __spreadProps$k(__spreadValues$w({}, request), {
        variable: {
          name: variable.state.name,
          type: variable.state.type
        },
        searchFilter
      }))
    ).pipe(
      rxjs.mergeMap((values) => {
        if (!values || !values.length) {
          return getEmptyMetricFindValueObservable();
        }
        const series = values;
        return rxjs.of({ series, state: data.LoadingState.Done, timeRange: request.range });
      })
    );
  }
}
class CustomQueryRunner {
  constructor(datasource, _runRequest = runtime.getRunRequest()) {
    this.datasource = datasource;
    this._runRequest = _runRequest;
  }
  getTarget(variable) {
    if (hasCustomVariableSupport(this.datasource)) {
      return variable.state.query;
    }
    throw new Error("Couldn't create a target with supplied arguments.");
  }
  runRequest(_, request) {
    if (!hasCustomVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }
    if (!this.datasource.variables.query) {
      return this._runRequest(this.datasource, request);
    }
    return this._runRequest(this.datasource, request, this.datasource.variables.query.bind(this.datasource.variables));
  }
}
const variableDummyRefId = "variable-query";
class DatasourceQueryRunner {
  constructor(datasource, _runRequest = runtime.getRunRequest()) {
    this.datasource = datasource;
    this._runRequest = _runRequest;
  }
  getTarget(variable) {
    var _a;
    if (hasDataSourceVariableSupport(this.datasource)) {
      if (typeof variable.state.query === "string") {
        return variable.state.query;
      }
      return __spreadProps$k(__spreadValues$w({}, variable.state.query), { refId: (_a = variable.state.query.refId) != null ? _a : variableDummyRefId });
    }
    throw new Error("Couldn't create a target with supplied arguments.");
  }
  runRequest(_, request) {
    if (!hasDataSourceVariableSupport(this.datasource)) {
      return getEmptyMetricFindValueObservable();
    }
    return this._runRequest(this.datasource, request, this.datasource.query);
  }
}
function getEmptyMetricFindValueObservable() {
  return rxjs.of({ state: data.LoadingState.Done, series: [], timeRange: data.getDefaultTimeRange() });
}
function createQueryVariableRunnerFactory(datasource) {
  if (hasStandardVariableSupport(datasource)) {
    return new StandardQueryRunner(datasource, runtime.getRunRequest());
  }
  if (hasLegacyVariableSupport(datasource)) {
    return new LegacyQueryRunner(datasource);
  }
  if (hasCustomVariableSupport(datasource)) {
    return new CustomQueryRunner(datasource);
  }
  if (hasDataSourceVariableSupport(datasource)) {
    return new DatasourceQueryRunner(datasource);
  }
  throw new Error(`Couldn't create a query runner for datasource ${datasource.type}`);
}
let createQueryVariableRunner = createQueryVariableRunnerFactory;
function ensureVariableQueryModelIsADataQuery(variable) {
  var _a;
  const query = (_a = variable.state.query) != null ? _a : "";
  if (typeof query === "string") {
    return { query, refId: `variable-${variable.state.name}` };
  }
  if (query.refId == null) {
    return __spreadProps$k(__spreadValues$w({}, query), { refId: `variable-${variable.state.name}` });
  }
  return variable.state.query;
}

function metricNamesToVariableValues(variableRegEx, sort, metricNames) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  let regex;
  let options = [];
  if (variableRegEx) {
    regex = data.stringToJsRegex(variableRegEx);
  }
  for (let i = 0; i < metricNames.length; i++) {
    const item = metricNames[i];
    let text = (_b = (_a = item.text) != null ? _a : item.value) != null ? _b : "";
    let value = (_d = (_c = item.value) != null ? _c : item.text) != null ? _d : "";
    if (lodash.isNumber(value)) {
      value = value.toString();
    }
    if (lodash.isNumber(text)) {
      text = text.toString();
    }
    if (regex) {
      const matches = getAllMatches(value, regex);
      if (!matches.length) {
        continue;
      }
      const valueGroup = matches.find((m) => m.groups && m.groups.value);
      const textGroup = matches.find((m) => m.groups && m.groups.text);
      const firstMatch = matches.find((m) => m.length > 1);
      const manyMatches = matches.length > 1 && firstMatch;
      if (valueGroup || textGroup) {
        value = (_g = (_e = valueGroup == null ? void 0 : valueGroup.groups) == null ? void 0 : _e.value) != null ? _g : (_f = textGroup == null ? void 0 : textGroup.groups) == null ? void 0 : _f.text;
        text = (_j = (_h = textGroup == null ? void 0 : textGroup.groups) == null ? void 0 : _h.text) != null ? _j : (_i = valueGroup == null ? void 0 : valueGroup.groups) == null ? void 0 : _i.value;
      } else if (manyMatches) {
        for (let j = 0; j < matches.length; j++) {
          const match = matches[j];
          options.push({ label: match[1], value: match[1] });
        }
        continue;
      } else if (firstMatch) {
        text = firstMatch[1];
        value = firstMatch[1];
      }
    }
    options.push({ label: text, value });
  }
  options = lodash.uniqBy(options, "value");
  return sortVariableValues(options, sort);
}
const getAllMatches = (str, regex) => {
  const results = [];
  let matches = null;
  regex.lastIndex = 0;
  do {
    matches = regex.exec(str);
    if (matches) {
      results.push(matches);
    }
  } while (regex.global && matches && matches[0] !== "" && matches[0] !== void 0);
  return results;
};
const sortVariableValues = (options, sortOrder) => {
  if (sortOrder === data.VariableSort.disabled) {
    return options;
  }
  const sortByNumeric = (opt) => {
    if (!opt.text) {
      return -1;
    }
    const matches = opt.text.match(/.*?(\d+).*/);
    if (!matches || matches.length < 2) {
      return -1;
    } else {
      return parseInt(matches[1], 10);
    }
  };
  const sortByNaturalSort = (options2) => {
    return options2.sort((a, b) => {
      if (!a.text) {
        return -1;
      }
      if (!b.text) {
        return 1;
      }
      return a.text.localeCompare(b.text, void 0, { numeric: true });
    });
  };
  switch (sortOrder) {
    case data.VariableSort.alphabeticalAsc:
      options = lodash.sortBy(options, "label");
      break;
    case data.VariableSort.alphabeticalDesc:
      options = lodash.sortBy(options, "label").reverse();
      break;
    case data.VariableSort.numericalAsc:
      options = lodash.sortBy(options, sortByNumeric);
      break;
    case data.VariableSort.numericalDesc:
      options = lodash.sortBy(options, sortByNumeric);
      options = options.reverse();
      break;
    case data.VariableSort.alphabeticalCaseInsensitiveAsc:
      options = lodash.sortBy(options, (opt) => {
        return lodash.toLower(opt.label);
      });
      break;
    case data.VariableSort.alphabeticalCaseInsensitiveDesc:
      options = lodash.sortBy(options, (opt) => {
        return lodash.toLower(opt.label);
      });
      options = options.reverse();
      break;
    case (data.VariableSort.naturalAsc || 7):
      options = sortByNaturalSort(options);
      break;
    case (data.VariableSort.naturalDesc || 8):
      options = sortByNaturalSort(options);
      options = options.reverse();
      break;
  }
  return options;
};

function toMetricFindValues() {
  return (source) => source.pipe(
    rxjs.map((panelData) => {
      const frames = panelData.series;
      if (!frames || !frames.length) {
        return [];
      }
      if (areMetricFindValues(frames)) {
        return frames;
      }
      if (frames[0].fields.length === 0) {
        return [];
      }
      const processedDataFrames = data.getProcessedDataFrames(frames);
      const metrics = [];
      let valueIndex = -1;
      let textIndex = -1;
      let stringIndex = -1;
      let expandableIndex = -1;
      for (const frame of processedDataFrames) {
        for (let index = 0; index < frame.fields.length; index++) {
          const field = frame.fields[index];
          const fieldName = data.getFieldDisplayName(field, frame, frames).toLowerCase();
          if (field.type === data.FieldType.string && stringIndex === -1) {
            stringIndex = index;
          }
          if (fieldName === "text" && field.type === data.FieldType.string && textIndex === -1) {
            textIndex = index;
          }
          if (fieldName === "value" && field.type === data.FieldType.string && valueIndex === -1) {
            valueIndex = index;
          }
          if (fieldName === "expandable" && (field.type === data.FieldType.boolean || field.type === data.FieldType.number) && expandableIndex === -1) {
            expandableIndex = index;
          }
        }
      }
      if (stringIndex === -1) {
        throw new Error("Couldn't find any field of type string in the results.");
      }
      for (const frame of frames) {
        for (let index = 0; index < frame.length; index++) {
          const expandable = expandableIndex !== -1 ? frame.fields[expandableIndex].values.get(index) : void 0;
          const string = frame.fields[stringIndex].values.get(index);
          const text = textIndex !== -1 ? frame.fields[textIndex].values.get(index) : "";
          const value = valueIndex !== -1 ? frame.fields[valueIndex].values.get(index) : "";
          if (valueIndex === -1 && textIndex === -1) {
            metrics.push({ text: string, value: string, expandable });
            continue;
          }
          if (valueIndex === -1 && textIndex !== -1) {
            metrics.push({ text, value: text, expandable });
            continue;
          }
          if (valueIndex !== -1 && textIndex === -1) {
            metrics.push({ text: value, value, expandable });
            continue;
          }
          metrics.push({ text, value, expandable });
        }
      }
      return metrics;
    })
  );
}
function areMetricFindValues(data$1) {
  if (!data$1) {
    return false;
  }
  if (!data$1.length) {
    return true;
  }
  const firstValue = data$1[0];
  if (data.isDataFrame(firstValue)) {
    return false;
  }
  for (const firstValueKey in firstValue) {
    if (!firstValue.hasOwnProperty(firstValueKey)) {
      continue;
    }
    if (firstValue[firstValueKey] !== null && typeof firstValue[firstValueKey] !== "string" && typeof firstValue[firstValueKey] !== "number") {
      continue;
    }
    const key = firstValueKey.toLowerCase();
    if (key === "text" || key === "value") {
      return true;
    }
  }
  return false;
}

var __defProp$v = Object.defineProperty;
var __getOwnPropSymbols$v = Object.getOwnPropertySymbols;
var __hasOwnProp$v = Object.prototype.hasOwnProperty;
var __propIsEnum$v = Object.prototype.propertyIsEnumerable;
var __defNormalProp$v = (obj, key, value) => key in obj ? __defProp$v(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$v = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$v.call(b, prop))
      __defNormalProp$v(a, prop, b[prop]);
  if (__getOwnPropSymbols$v)
    for (var prop of __getOwnPropSymbols$v(b)) {
      if (__propIsEnum$v.call(b, prop))
        __defNormalProp$v(a, prop, b[prop]);
    }
  return a;
};
class QueryVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadValues$v({
      type: "query",
      name: "",
      value: "",
      text: "",
      options: [],
      datasource: null,
      regex: "",
      query: "",
      refresh: data.VariableRefresh.onDashboardLoad,
      sort: data.VariableSort.disabled
    }, initialState));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["regex", "query", "datasource"]
    });
    this.onSearchChange = (searchFilter) => {
      if (!containsSearchFilter(this.state.query)) {
        return;
      }
      this._updateOptionsBasedOnSearchFilter(searchFilter);
    };
    this._updateOptionsBasedOnSearchFilter = lodash.debounce(async (searchFilter) => {
      const result = await rxjs.lastValueFrom(this.getValueOptions({ searchFilter }));
      this.setState({ options: result, loading: false });
    }, 400);
  }
  getValueOptions(args) {
    if (!this.state.query) {
      return rxjs.of([]);
    }
    this.setState({ loading: true, error: null });
    return rxjs.from(
      getDataSource(this.state.datasource, {
        __sceneObject: wrapInSafeSerializableSceneObject(this)
      })
    ).pipe(
      rxjs.mergeMap((ds) => {
        const runner = createQueryVariableRunner(ds);
        const target = runner.getTarget(this);
        const request = this.getRequest(target, args.searchFilter);
        return runner.runRequest({ variable: this, searchFilter: args.searchFilter }, request).pipe(
          registerQueryWithController({
            type: "variable",
            request,
            origin: this
          }),
          rxjs.filter((data$1) => data$1.state === data.LoadingState.Done || data$1.state === data.LoadingState.Error),
          rxjs.take(1),
          rxjs.mergeMap((data$1) => {
            if (data$1.state === data.LoadingState.Error) {
              return rxjs.throwError(() => data$1.error);
            }
            return rxjs.of(data$1);
          }),
          toMetricFindValues(),
          rxjs.mergeMap((values) => {
            let regex = "";
            if (this.state.regex) {
              regex = sceneGraph.interpolate(this, this.state.regex, void 0, "regex");
            }
            return rxjs.of(metricNamesToVariableValues(regex, this.state.sort, values));
          }),
          rxjs.catchError((error) => {
            if (error.cancelled) {
              return rxjs.of([]);
            }
            return rxjs.throwError(() => error);
          })
        );
      })
    );
  }
  getRequest(target, searchFilter) {
    const scopedVars = {
      __sceneObject: wrapInSafeSerializableSceneObject(this)
    };
    if (searchFilter) {
      scopedVars.__searchFilter = { value: searchFilter, text: searchFilter };
    }
    const range = sceneGraph.getTimeRange(this).state.value;
    const request = {
      app: data.CoreApp.Dashboard,
      requestId: uuid.v4(),
      timezone: "",
      range,
      interval: "",
      intervalMs: 0,
      targets: [target],
      scopedVars,
      startTime: Date.now()
    };
    return request;
  }
}
QueryVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};
function containsSearchFilter(query) {
  const str = safeStringifyValue(query);
  return str.indexOf(SEARCH_FILTER_VARIABLE) > -1;
}

function getVariables(sceneObject) {
  var _a;
  return (_a = getClosest(sceneObject, (s) => s.state.$variables)) != null ? _a : EmptyVariableSet;
}
function getData(sceneObject) {
  var _a;
  return (_a = getClosest(sceneObject, (s) => s.state.$data)) != null ? _a : EmptyDataNode;
}
function isSceneLayout(s) {
  return "isDraggable" in s;
}
function getLayout(scene) {
  const parent = getClosest(scene, (s) => isSceneLayout(s) ? s : void 0);
  if (parent) {
    return parent;
  }
  return null;
}
function interpolate(sceneObject, value, scopedVars, format, interpolations) {
  if (value === "" || value == null) {
    return "";
  }
  return sceneInterpolator(sceneObject, value, scopedVars, format, interpolations);
}
function hasVariableDependencyInLoadingState(sceneObject) {
  if (!sceneObject.variableDependency) {
    return false;
  }
  for (const name of sceneObject.variableDependency.getNames()) {
    if (sceneObject instanceof QueryVariable && sceneObject.state.name === name) {
      console.warn("Query variable is referencing itself");
      continue;
    }
    const variable = lookupVariable(name, sceneObject);
    if (!variable) {
      continue;
    }
    const set = variable.parent;
    if (set.isVariableLoadingOrWaitingToUpdate(variable)) {
      return true;
    }
  }
  return false;
}
function findObjectInternal(scene, check, alreadySearchedChild, shouldSearchUp) {
  if (check(scene)) {
    return scene;
  }
  let found = null;
  scene.forEachChild((child) => {
    if (child === alreadySearchedChild) {
      return;
    }
    let maybe = findObjectInternal(child, check);
    if (maybe) {
      found = maybe;
    }
  });
  if (found) {
    return found;
  }
  if (shouldSearchUp && scene.parent) {
    return findObjectInternal(scene.parent, check, scene, true);
  }
  return null;
}
function findByKey(sceneObject, key) {
  const found = findObject(sceneObject, (sceneToCheck) => {
    return sceneToCheck.state.key === key;
  });
  if (!found) {
    throw new Error("Unable to find scene with key " + key);
  }
  return found;
}
function findByKeyAndType(sceneObject, key, targetType) {
  const found = findObject(sceneObject, (sceneToCheck) => {
    return sceneToCheck.state.key === key;
  });
  if (!found) {
    throw new Error("Unable to find scene with key " + key);
  }
  if (!(found instanceof targetType)) {
    throw new Error(`Found scene object with key ${key} does not match type ${targetType.name}`);
  }
  return found;
}
function findObject(scene, check) {
  return findObjectInternal(scene, check, void 0, true);
}
function findAllObjects(scene, check) {
  const found = [];
  scene.forEachChild((child) => {
    if (check(child)) {
      found.push(child);
    }
    found.push(...findAllObjects(child, check));
  });
  return found;
}
function getDataLayers(sceneObject, localOnly = false) {
  let currentLevel = sceneObject;
  let collected = [];
  while (currentLevel) {
    const dataProvider = currentLevel.state.$data;
    if (!dataProvider) {
      currentLevel = currentLevel.parent;
      continue;
    }
    if (isDataLayer(dataProvider)) {
      collected = collected.concat(dataProvider);
    } else {
      if (dataProvider.state.$data && isDataLayer(dataProvider.state.$data)) {
        collected = collected.concat(dataProvider.state.$data);
      }
    }
    if (localOnly && collected.length > 0) {
      break;
    }
    currentLevel = currentLevel.parent;
  }
  return collected;
}
function getAncestor(sceneObject, ancestorType) {
  let parent = sceneObject;
  while (parent) {
    if (parent instanceof ancestorType) {
      return parent;
    }
    parent = parent.parent;
  }
  if (!parent) {
    throw new Error("Unable to find parent of type " + ancestorType.name);
  }
  return parent;
}
function findDescendents(scene, descendentType) {
  function isDescendentType(scene2) {
    return scene2 instanceof descendentType;
  }
  const targetScenes = findAllObjects(scene, isDescendentType);
  return targetScenes.filter(isDescendentType);
}
function getQueryController(sceneObject) {
  let parent = sceneObject;
  while (parent) {
    if (parent.state.$behaviors) {
      for (const behavior of parent.state.$behaviors) {
        if (isQueryController(behavior)) {
          return behavior;
        }
      }
    }
    parent = parent.parent;
  }
  return void 0;
}
function getUrlSyncManager(sceneObject) {
  let parent = sceneObject;
  while (parent) {
    if ("urlSyncManager" in parent.state) {
      return parent.state.urlSyncManager;
    }
    parent = parent.parent;
  }
  return void 0;
}

const sceneGraph = {
  getVariables,
  getData,
  getTimeRange,
  getLayout,
  getDataLayers,
  interpolate,
  lookupVariable,
  hasVariableDependencyInLoadingState,
  findByKey,
  findByKeyAndType,
  findObject,
  findAllObjects,
  getAncestor,
  findDescendents,
  getQueryController,
  getUrlSyncManager
};

class UniqueUrlKeyMapper {
  constructor() {
    this.index = /* @__PURE__ */ new Map();
  }
  getUniqueKey(key, obj) {
    const objectsWithKey = this.index.get(key);
    if (!objectsWithKey) {
      this.index.set(key, [obj]);
      return key;
    }
    let address = objectsWithKey.findIndex((o) => o === obj);
    if (address === -1) {
      filterOutOrphanedObjects(objectsWithKey);
      objectsWithKey.push(obj);
      address = objectsWithKey.length - 1;
    }
    if (address > 0) {
      return `${key}-${address + 1}`;
    }
    return key;
  }
  clear() {
    this.index.clear();
  }
}
function filterOutOrphanedObjects(sceneObjects) {
  for (const obj of sceneObjects) {
    if (isOrphanOrInActive(obj)) {
      const index = sceneObjects.indexOf(obj);
      sceneObjects.splice(index, 1);
    }
  }
}
function isOrphanOrInActive(obj) {
  const root = obj.getRoot();
  if (!sceneGraph.findObject(root, (child) => child === obj)) {
    return true;
  }
  return false;
}

function getUrlState(root) {
  const urlKeyMapper = new UniqueUrlKeyMapper();
  const result = {};
  const visitNode = (obj) => {
    if (obj.urlSync) {
      const newUrlState = obj.urlSync.getUrlState();
      for (const [key, value] of Object.entries(newUrlState)) {
        if (value != null) {
          const uniqueKey = urlKeyMapper.getUniqueKey(key, obj);
          result[uniqueKey] = value;
        }
      }
    }
    obj.forEachChild(visitNode);
  };
  visitNode(root);
  return result;
}
function syncStateFromSearchParams(root, urlParams) {
  const urlKeyMapper = new UniqueUrlKeyMapper();
  syncStateFromUrl(root, urlParams, urlKeyMapper);
}
function syncStateFromUrl(root, urlParams, urlKeyMapper, onlyChildren) {
  if (!onlyChildren) {
    syncUrlStateToObject(root, urlParams, urlKeyMapper);
  }
  root.forEachChild((child) => {
    syncUrlStateToObject(child, urlParams, urlKeyMapper);
  });
  root.forEachChild((child) => syncStateFromUrl(child, urlParams, urlKeyMapper, true));
}
function syncUrlStateToObject(sceneObject, urlParams, urlKeyMapper) {
  if (sceneObject.urlSync) {
    const urlState = {};
    const currentState = sceneObject.urlSync.getUrlState();
    for (const key of sceneObject.urlSync.getKeys()) {
      const uniqueKey = urlKeyMapper.getUniqueKey(key, sceneObject);
      const newValue = urlParams.getAll(uniqueKey);
      const currentValue = currentState[key];
      if (isUrlValueEqual(newValue, currentValue)) {
        continue;
      }
      if (newValue.length > 0) {
        if (Array.isArray(currentValue)) {
          urlState[key] = newValue;
        } else {
          urlState[key] = newValue[0];
        }
      } else {
        urlState[key] = null;
      }
    }
    if (Object.keys(urlState).length > 0) {
      sceneObject.urlSync.updateFromUrl(urlState);
    }
  }
}
function isUrlValueEqual(currentUrlValue, newUrlValue) {
  if (currentUrlValue.length === 0 && newUrlValue == null) {
    return true;
  }
  if (!Array.isArray(newUrlValue) && (currentUrlValue == null ? void 0 : currentUrlValue.length) === 1) {
    return newUrlValue === currentUrlValue[0];
  }
  if ((newUrlValue == null ? void 0 : newUrlValue.length) === 0 && currentUrlValue === null) {
    return true;
  }
  return lodash.isEqual(currentUrlValue, newUrlValue);
}

function isAdHocVariable(variable) {
  return variable.state.type === "adhoc";
}
function isConstantVariable(variable) {
  return variable.state.type === "constant";
}
function isCustomVariable(variable) {
  return variable.state.type === "custom";
}
function isDataSourceVariable(variable) {
  return variable.state.type === "datasource";
}
function isIntervalVariable(variable) {
  return variable.state.type === "interval";
}
function isQueryVariable(variable) {
  return variable.state.type === "query";
}
function isTextBoxVariable(variable) {
  return variable.state.type === "textbox";
}
function isGroupByVariable(variable) {
  return variable.state.type === "groupby";
}

class ActWhenVariableChanged extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this._runningEffect = null;
    this._variableDependency = new VariableDependencyConfig(this, {
      variableNames: [this.state.variableName],
      onReferencedVariableValueChanged: this._onVariableChanged.bind(this)
    });
  }
  _onVariableChanged(variable) {
    const effect = this.state.onChange;
    if (this._runningEffect) {
      this._runningEffect();
      this._runningEffect = null;
    }
    const cancellation = effect(variable, this);
    if (cancellation) {
      this._runningEffect = cancellation;
    }
  }
}

var __defProp$u = Object.defineProperty;
var __defProps$j = Object.defineProperties;
var __getOwnPropDescs$j = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$u = Object.getOwnPropertySymbols;
var __hasOwnProp$u = Object.prototype.hasOwnProperty;
var __propIsEnum$u = Object.prototype.propertyIsEnumerable;
var __defNormalProp$u = (obj, key, value) => key in obj ? __defProp$u(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$u = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$u.call(b, prop))
      __defNormalProp$u(a, prop, b[prop]);
  if (__getOwnPropSymbols$u)
    for (var prop of __getOwnPropSymbols$u(b)) {
      if (__propIsEnum$u.call(b, prop))
        __defNormalProp$u(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$j = (a, b) => __defProps$j(a, __getOwnPropDescs$j(b));
class CursorSync extends SceneObjectBase {
  constructor(state) {
    super(__spreadProps$j(__spreadValues$u({}, state), {
      sync: state.sync || schema.DashboardCursorSync.Off
    }));
    this.getEventsBus = (panel) => {
      if (!this.parent) {
        throw new Error("EnableCursorSync cannot be used as a standalone scene object");
      }
      return new PanelContextEventBus(this.parent, panel);
    };
  }
  getEventsScope() {
    if (!this.parent) {
      throw new Error("EnableCursorSync cannot be used as a standalone scene object");
    }
    return this.state.key;
  }
}
class PanelContextEventBus {
  constructor(_source, _eventsOrigin) {
    this._source = _source;
    this._eventsOrigin = _eventsOrigin;
  }
  publish(event) {
    event.origin = this;
    this._eventsOrigin.publishEvent(event, true);
  }
  getStream(eventType) {
    return new rxjs.Observable((observer) => {
      const handler = (event) => {
        observer.next(event);
      };
      const sub = this._source.subscribeToEvent(eventType, handler);
      return () => sub.unsubscribe();
    });
  }
  subscribe(eventType, handler) {
    return this.getStream(eventType).pipe().subscribe(handler);
  }
  removeAllListeners() {
  }
  newScopedBus(key, filter) {
    throw new Error("For internal use only");
  }
}
function getCursorSyncScope(sceneObject) {
  return sceneGraph.findObject(sceneObject, (o) => o instanceof CursorSync);
}

function VizPanelSeriesLimit({ data, showAll, seriesLimit, onShowAllSeries }) {
  const styles = ui.useStyles2(getStyles$8);
  const seriesCount = data == null ? void 0 : data.series.length;
  if (seriesCount === void 0 || seriesCount < seriesLimit) {
    return null;
  }
  const buttonText = showAll ? "Restore limit" : `Show all ${seriesCount}`;
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.timeSeriesDisclaimer
  }, !showAll && /* @__PURE__ */ React__default["default"].createElement("span", {
    className: styles.warningMessage
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
    title: `Showing only ${seriesLimit} series`,
    name: "exclamation-triangle",
    "aria-hidden": "true"
  })), /* @__PURE__ */ React__default["default"].createElement(ui.Tooltip, {
    content: "Rendering too many series in a single panel may impact performance and make data harder to read."
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Button, {
    variant: "secondary",
    size: "sm",
    onClick: onShowAllSeries
  }, buttonText)));
}
const getStyles$8 = (theme) => ({
  timeSeriesDisclaimer: css.css({
    label: "time-series-disclaimer",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  }),
  warningMessage: css.css({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    color: theme.colors.warning.main,
    fontSize: theme.typography.bodySmall.fontSize
  })
});

var __defProp$t = Object.defineProperty;
var __defProps$i = Object.defineProperties;
var __getOwnPropDescs$i = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$t = Object.getOwnPropertySymbols;
var __hasOwnProp$t = Object.prototype.hasOwnProperty;
var __propIsEnum$t = Object.prototype.propertyIsEnumerable;
var __defNormalProp$t = (obj, key, value) => key in obj ? __defProp$t(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$t = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$t.call(b, prop))
      __defNormalProp$t(a, prop, b[prop]);
  if (__getOwnPropSymbols$t)
    for (var prop of __getOwnPropSymbols$t(b)) {
      if (__propIsEnum$t.call(b, prop))
        __defNormalProp$t(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$i = (a, b) => __defProps$i(a, __getOwnPropDescs$i(b));
function VizPanelRenderer({ model }) {
  var _a, _b, _c;
  const {
    title,
    options,
    fieldConfig,
    _pluginLoadError,
    displayMode,
    hoverHeader,
    showMenuAlways,
    hoverHeaderOffset,
    menu,
    headerActions,
    titleItems,
    seriesLimit,
    seriesLimitShowAll,
    description,
    collapsible,
    collapsed,
    _renderCounter = 0
  } = model.useState();
  const [ref, { width, height }] = reactUse.useMeasure();
  const appEvents = React.useMemo(() => runtime.getAppEvents(), []);
  const setPanelAttention = React.useCallback(() => {
    if (model.state.key) {
      appEvents.publish(new data.SetPanelAttentionEvent({ panelId: model.state.key }));
    }
  }, [model.state.key, appEvents]);
  const debouncedMouseMove = React.useMemo(
    () => lodash.debounce(setPanelAttention, 100, { leading: true, trailing: false }),
    [setPanelAttention]
  );
  const plugin = model.getPlugin();
  const { dragClass, dragClassCancel } = getDragClasses(model);
  const dataObject = sceneGraph.getData(model);
  const rawData = dataObject.useState();
  const dataWithSeriesLimit = useDataWithSeriesLimit(rawData.data, seriesLimit, seriesLimitShowAll);
  const dataWithFieldConfig = model.applyFieldConfig(dataWithSeriesLimit);
  const sceneTimeRange = sceneGraph.getTimeRange(model);
  const timeZone = sceneTimeRange.getTimeZone();
  const timeRange = model.getTimeRange(dataWithFieldConfig);
  const titleInterpolated = model.interpolate(title, void 0, "text");
  const alertStateStyles = ui.useStyles2(getAlertStateStyles);
  if (!plugin) {
    return /* @__PURE__ */ React__default["default"].createElement("div", null, "Loading plugin panel...");
  }
  if (!plugin.panel) {
    return /* @__PURE__ */ React__default["default"].createElement("div", null, "Panel plugin has no panel component");
  }
  const PanelComponent = plugin.panel;
  if (dataObject && dataObject.setContainerWidth) {
    dataObject.setContainerWidth(Math.round(width));
  }
  let titleItemsElement = [];
  if (titleItems) {
    if (Array.isArray(titleItems)) {
      titleItemsElement = titleItemsElement.concat(
        titleItems.map((titleItem) => {
          return /* @__PURE__ */ React__default["default"].createElement(titleItem.Component, {
            model: titleItem,
            key: `${titleItem.state.key}`
          });
        })
      );
    } else if (isSceneObject(titleItems)) {
      titleItemsElement.push(/* @__PURE__ */ React__default["default"].createElement(titleItems.Component, {
        model: titleItems
      }));
    } else {
      titleItemsElement.push(titleItems);
    }
  }
  if (seriesLimit) {
    titleItemsElement.push(
      /* @__PURE__ */ React__default["default"].createElement(VizPanelSeriesLimit, {
        key: "series-limit",
        data: rawData.data,
        seriesLimit,
        showAll: seriesLimitShowAll,
        onShowAllSeries: () => model.setState({ seriesLimitShowAll: !seriesLimitShowAll })
      })
    );
  }
  if (model.state.$timeRange) {
    titleItemsElement.push(/* @__PURE__ */ React__default["default"].createElement(model.state.$timeRange.Component, {
      model: model.state.$timeRange,
      key: model.state.key
    }));
  }
  if (dataWithFieldConfig.alertState) {
    titleItemsElement.push(
      /* @__PURE__ */ React__default["default"].createElement(ui.Tooltip, {
        content: (_a = dataWithFieldConfig.alertState.state) != null ? _a : "unknown",
        key: `alert-states-icon-${model.state.key}`
      }, /* @__PURE__ */ React__default["default"].createElement(ui.PanelChrome.TitleItem, {
        className: css.cx({
          [alertStateStyles.ok]: dataWithFieldConfig.alertState.state === data.AlertState.OK,
          [alertStateStyles.pending]: dataWithFieldConfig.alertState.state === data.AlertState.Pending,
          [alertStateStyles.alerting]: dataWithFieldConfig.alertState.state === data.AlertState.Alerting
        })
      }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
        name: dataWithFieldConfig.alertState.state === "alerting" ? "heart-break" : "heart",
        className: "panel-alert-icon",
        size: "md"
      })))
    );
  }
  let panelMenu;
  if (menu) {
    panelMenu = /* @__PURE__ */ React__default["default"].createElement(menu.Component, {
      model: menu
    });
  }
  let actionsElement;
  if (headerActions) {
    if (Array.isArray(headerActions)) {
      actionsElement = /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, headerActions.map((action) => {
        return /* @__PURE__ */ React__default["default"].createElement(action.Component, {
          model: action,
          key: `${action.state.key}`
        });
      }));
    } else if (isSceneObject(headerActions)) {
      actionsElement = /* @__PURE__ */ React__default["default"].createElement(headerActions.Component, {
        model: headerActions
      });
    } else {
      actionsElement = headerActions;
    }
  }
  const data$1 = dataWithFieldConfig;
  const isReadyToRender = dataObject.isDataReadyToDisplay ? dataObject.isDataReadyToDisplay() : true;
  const context = model.getPanelContext();
  const panelId = model.getLegacyPanelId();
  let datasource = (_c = (_b = data$1.request) == null ? void 0 : _b.targets[0]) == null ? void 0 : _c.datasource;
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: relativeWrapper + " oodle-panel"
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    ref,
    className: absoluteWrapper,
    "data-viz-panel-key": model.state.key
  }, width > 0 && height > 0 && /* @__PURE__ */ React__default["default"].createElement(ui.PanelChrome, {
    title: titleInterpolated,
    description: (description == null ? void 0 : description.trim()) ? model.getDescription : void 0,
    loadingState: data$1.state,
    statusMessage: getChromeStatusMessage(data$1, _pluginLoadError),
    statusMessageOnClick: model.onStatusMessageClick,
    width,
    height,
    selectionId: model.state.key,
    displayMode,
    showMenuAlways,
    hoverHeader,
    hoverHeaderOffset,
    titleItems: titleItemsElement,
    dragClass,
    actions: actionsElement,
    dragClassCancel,
    padding: plugin.noPadding ? "none" : "md",
    menu: panelMenu,
    onCancelQuery: model.onCancelQuery,
    onFocus: setPanelAttention,
    onMouseEnter: setPanelAttention,
    onMouseMove: debouncedMouseMove,
    collapsible,
    collapsed,
    onToggleCollapse: model.onToggleCollapse
  }, (innerWidth, innerHeight) => {
    var _a2;
    return /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, plugin.meta.id === "timeseries" && /* @__PURE__ */ React__default["default"].createElement(ui.Button, {
      style: { top: ((_a2 = model.state.title) == null ? void 0 : _a2.length) > 0 ? "-32px" : "0px", right: "28px", position: "absolute", border: 0, padding: 0 },
      variant: "secondary",
      fill: "outline",
      type: "button",
      "data-testid": "send-query-button",
      tooltip: "Oodle insight",
      tooltipPlacement: "top",
      hidden: (datasource == null ? void 0 : datasource.type) !== "prometheus",
      onClick: () => {
        var _a3, _b2;
        const variables = __spreadValues$t({}, (_a3 = data$1 == null ? void 0 : data$1.request) == null ? void 0 : _a3.scopedVars);
        variables.__interval = {
          value: "$__interval"
        };
        variables.__interval_ms = {
          value: "$__interval_ms"
        };
        let timeRange2 = (_b2 = data$1.request) == null ? void 0 : _b2.range;
        let rangeDurationMs = timeRange2.to.valueOf() - timeRange2.from.valueOf();
        runtime.getDataSourceSrv().get(datasource, variables).then((ds) => {
          var _a4, _b3, _c2, _d, _e, _f;
          if (ds.interpolateVariablesInQueries) {
            let targets = ds.interpolateVariablesInQueries((_a4 = data$1.request) == null ? void 0 : _a4.targets, variables);
            sendOodleInsightEvent(
              (_b3 = data$1.request) == null ? void 0 : _b3.dashboardUID,
              "Insights",
              model.state.title,
              (_c2 = data$1.request) == null ? void 0 : _c2.panelId,
              targets,
              timeRange2,
              rangeDurationMs,
              (_f = (_e = (_d = model.state) == null ? void 0 : _d.fieldConfig) == null ? void 0 : _e.defaults) == null ? void 0 : _f.unit
            );
          } else {
            throw new Error("datasource does not support variable interpolation");
          }
        }).catch((_) => {
          var _a4, _b3, _c2, _d, _e, _f;
          sendOodleInsightEvent(
            (_a4 = data$1.request) == null ? void 0 : _a4.dashboardUID,
            "Insights",
            model.state.title,
            (_b3 = data$1.request) == null ? void 0 : _b3.panelId,
            (_c2 = data$1.request) == null ? void 0 : _c2.targets,
            timeRange2,
            rangeDurationMs,
            (_f = (_e = (_d = model.state) == null ? void 0 : _d.fieldConfig) == null ? void 0 : _e.defaults) == null ? void 0 : _f.unit
          );
        });
      }
    }, /* @__PURE__ */ React__default["default"].createElement("img", {
      src: "https://imagedelivery.net/oP5rEbdkySYwiZY4N9HGRw/d0e74e50-902c-4b3c-90af-cabc367bcb00/public",
      alt: "Insight icon",
      "data-testid": "insight-icon",
      style: { height: "25px" }
    })), /* @__PURE__ */ React__default["default"].createElement(ui.ErrorBoundaryAlert, {
      dependencies: [plugin, data$1]
    }, /* @__PURE__ */ React__default["default"].createElement(data.PluginContextProvider, {
      meta: plugin.meta
    }, /* @__PURE__ */ React__default["default"].createElement(ui.PanelContextProvider, {
      value: context
    }, isReadyToRender && /* @__PURE__ */ React__default["default"].createElement(PanelComponent, {
      id: panelId,
      data: data$1,
      title,
      timeRange,
      timeZone,
      options,
      fieldConfig,
      transparent: false,
      width: innerWidth,
      height: innerHeight,
      renderCounter: _renderCounter,
      replaceVariables: model.interpolate,
      onOptionsChange: model.onOptionsChange,
      onFieldConfigChange: model.onFieldConfigChange,
      onChangeTimeRange: model.onTimeRangeChange,
      eventBus: context.eventBus
    })))));
  })));
}
const sendOodleInsightEvent = (dashboardUId, dashboardTitle, panelTitle, panelId, expressionData, dashboardTime, rangeDurationMs, unit) => {
  const eventData = {
    dashboardUId,
    dashboardTitle,
    panelTitle,
    panelId,
    expressionData,
    dashboardTime,
    rangeDurationMs,
    unit
  };
  sendEventToParent({
    type: "message",
    payload: {
      source: "oodle-grafana",
      eventType: "sendQuery",
      value: JSON.parse(JSON.stringify(eventData))
    }
  });
};
function sendEventToParent(data) {
  window.parent.postMessage(data, "*");
}
function useDataWithSeriesLimit(data, seriesLimit, showAllSeries) {
  return React.useMemo(() => {
    if (!(data == null ? void 0 : data.series) || !seriesLimit || showAllSeries) {
      return data;
    }
    return __spreadProps$i(__spreadValues$t({}, data), {
      series: data.series.slice(0, seriesLimit)
    });
  }, [data, seriesLimit, showAllSeries]);
}
function getDragClasses(panel) {
  var _a, _b;
  const parentLayout = sceneGraph.getLayout(panel);
  const isDraggable = parentLayout == null ? void 0 : parentLayout.isDraggable();
  if (!parentLayout || !isDraggable || itemDraggingDisabled(panel, parentLayout)) {
    return { dragClass: "", dragClassCancel: "" };
  }
  return { dragClass: (_a = parentLayout.getDragClass) == null ? void 0 : _a.call(parentLayout), dragClassCancel: (_b = parentLayout == null ? void 0 : parentLayout.getDragClassCancel) == null ? void 0 : _b.call(parentLayout) };
}
function itemDraggingDisabled(item, layout) {
  let ancestor = item.parent;
  while (ancestor && ancestor !== layout) {
    if ("isDraggable" in ancestor.state && ancestor.state.isDraggable === false) {
      return true;
    }
    ancestor = ancestor.parent;
  }
  return false;
}
function getChromeStatusMessage(data, pluginLoadingError) {
  if (pluginLoadingError) {
    return pluginLoadingError;
  }
  let message = data.error ? data.error.message : void 0;
  if (data.errors) {
    message = data.errors.map((e) => e.message).join(", ");
  }
  return message;
}
const relativeWrapper = css.css({
  position: "relative",
  width: "100%",
  height: "100%"
});
const absoluteWrapper = css.css({
  position: "absolute",
  width: "100%",
  height: "100%"
});
const getAlertStateStyles = (theme) => {
  return {
    ok: css.css({
      color: theme.colors.success.text
    }),
    pending: css.css({
      color: theme.colors.warning.text
    }),
    alerting: css.css({
      color: theme.colors.error.text
    })
  };
};

var __defProp$s = Object.defineProperty;
var __defProps$h = Object.defineProperties;
var __getOwnPropDescs$h = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$s = Object.getOwnPropertySymbols;
var __hasOwnProp$s = Object.prototype.hasOwnProperty;
var __propIsEnum$s = Object.prototype.propertyIsEnumerable;
var __defNormalProp$s = (obj, key, value) => key in obj ? __defProp$s(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$s = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$s.call(b, prop))
      __defNormalProp$s(a, prop, b[prop]);
  if (__getOwnPropSymbols$s)
    for (var prop of __getOwnPropSymbols$s(b)) {
      if (__propIsEnum$s.call(b, prop))
        __defNormalProp$s(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$h = (a, b) => __defProps$h(a, __getOwnPropDescs$h(b));
const displayOverrideRef = "hideSeriesFrom";
const isHideSeriesOverride = data.isSystemOverrideWithRef(displayOverrideRef);
function seriesVisibilityConfigFactory(label, mode, fieldConfig, data) {
  const { overrides } = fieldConfig;
  const displayName = label;
  const currentIndex = overrides.findIndex(isHideSeriesOverride);
  if (currentIndex < 0) {
    if (mode === ui.SeriesVisibilityChangeMode.ToggleSelection) {
      const override3 = createOverride$1([displayName, ...getNamesOfHiddenFields(overrides, data)]);
      return __spreadProps$h(__spreadValues$s({}, fieldConfig), {
        overrides: [...fieldConfig.overrides, override3]
      });
    }
    const displayNames = getDisplayNames(data, displayName);
    const override2 = createOverride$1(displayNames);
    return __spreadProps$h(__spreadValues$s({}, fieldConfig), {
      overrides: [...fieldConfig.overrides, override2]
    });
  }
  const overridesCopy = Array.from(overrides);
  const [current] = overridesCopy.splice(currentIndex, 1);
  if (mode === ui.SeriesVisibilityChangeMode.ToggleSelection) {
    let existing = getExistingDisplayNames(current);
    const nameOfHiddenFields = getNamesOfHiddenFields(overridesCopy, data);
    if (nameOfHiddenFields.length > 0) {
      existing = existing.filter((el) => nameOfHiddenFields.indexOf(el) < 0);
    }
    if (existing[0] === displayName && existing.length === 1) {
      return __spreadProps$h(__spreadValues$s({}, fieldConfig), {
        overrides: overridesCopy
      });
    }
    const override2 = createOverride$1([displayName, ...nameOfHiddenFields]);
    return __spreadProps$h(__spreadValues$s({}, fieldConfig), {
      overrides: [...overridesCopy, override2]
    });
  }
  const override = createExtendedOverride(current, displayName);
  if (allFieldsAreExcluded(override, data)) {
    return __spreadProps$h(__spreadValues$s({}, fieldConfig), {
      overrides: overridesCopy
    });
  }
  return __spreadProps$h(__spreadValues$s({}, fieldConfig), {
    overrides: [...overridesCopy, override]
  });
}
function createOverride$1(names, mode = data.ByNamesMatcherMode.exclude, property) {
  property = property != null ? property : {
    id: "custom.hideFrom",
    value: {
      viz: true,
      legend: false,
      tooltip: false
    }
  };
  return {
    __systemRef: displayOverrideRef,
    matcher: {
      id: data.FieldMatcherID.byNames,
      options: {
        mode,
        names,
        prefix: mode === data.ByNamesMatcherMode.exclude ? "All except:" : void 0,
        readOnly: true
      }
    },
    properties: [
      __spreadProps$h(__spreadValues$s({}, property), {
        value: {
          viz: true,
          legend: false,
          tooltip: false
        }
      })
    ]
  };
}
const createExtendedOverride = (current, displayName, mode = data.ByNamesMatcherMode.exclude) => {
  const property = current.properties.find((p) => p.id === "custom.hideFrom");
  const existing = getExistingDisplayNames(current);
  const index = existing.findIndex((name) => name === displayName);
  if (index < 0) {
    existing.push(displayName);
  } else {
    existing.splice(index, 1);
  }
  return createOverride$1(existing, mode, property);
};
const getExistingDisplayNames = (rule) => {
  var _a;
  const names = (_a = rule.matcher.options) == null ? void 0 : _a.names;
  if (!Array.isArray(names)) {
    return [];
  }
  return [...names];
};
const allFieldsAreExcluded = (override, data) => {
  return getExistingDisplayNames(override).length === getDisplayNames(data).length;
};
const getDisplayNames = (data$1, excludeName) => {
  const unique = /* @__PURE__ */ new Set();
  for (const frame of data$1) {
    for (const field of frame.fields) {
      if (field.type !== data.FieldType.number) {
        continue;
      }
      const name = data.getFieldDisplayName(field, frame, data$1);
      if (name === excludeName) {
        continue;
      }
      unique.add(name);
    }
  }
  return Array.from(unique);
};
const getNamesOfHiddenFields = (overrides, data$1) => {
  var _a;
  let names = [];
  for (const override of overrides) {
    const property = override.properties.find((p) => p.id === "custom.hideFrom");
    if (property !== void 0 && ((_a = property.value) == null ? void 0 : _a.legend) === true) {
      const info = data.fieldMatchers.get(override.matcher.id);
      const matcher = info.get(override.matcher.options);
      for (const frame of data$1) {
        for (const field of frame.fields) {
          if (field.type !== data.FieldType.number) {
            continue;
          }
          const name = data.getFieldDisplayName(field, frame, data$1);
          if (matcher(field, frame, data$1)) {
            names.push(name);
          }
        }
      }
    }
  }
  return names;
};

var __defProp$r = Object.defineProperty;
var __defProps$g = Object.defineProperties;
var __getOwnPropDescs$g = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$r = Object.getOwnPropertySymbols;
var __hasOwnProp$r = Object.prototype.hasOwnProperty;
var __propIsEnum$r = Object.prototype.propertyIsEnumerable;
var __defNormalProp$r = (obj, key, value) => key in obj ? __defProp$r(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$r = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$r.call(b, prop))
      __defNormalProp$r(a, prop, b[prop]);
  if (__getOwnPropSymbols$r)
    for (var prop of __getOwnPropSymbols$r(b)) {
      if (__propIsEnum$r.call(b, prop))
        __defNormalProp$r(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$g = (a, b) => __defProps$g(a, __getOwnPropDescs$g(b));
const changeSeriesColorConfigFactory = (label, color, fieldConfig) => {
  const { overrides } = fieldConfig;
  const currentIndex = fieldConfig.overrides.findIndex((override) => {
    return override.matcher.id === data.FieldMatcherID.byName && override.matcher.options === label;
  });
  if (currentIndex < 0) {
    return __spreadProps$g(__spreadValues$r({}, fieldConfig), {
      overrides: [...fieldConfig.overrides, createOverride(label, color)]
    });
  }
  const overridesCopy = Array.from(overrides);
  const existing = overridesCopy[currentIndex];
  const propertyIndex = existing.properties.findIndex((p) => p.id === "color");
  if (propertyIndex < 0) {
    overridesCopy[currentIndex] = __spreadProps$g(__spreadValues$r({}, existing), {
      properties: [...existing.properties, createProperty(color)]
    });
    return __spreadProps$g(__spreadValues$r({}, fieldConfig), {
      overrides: overridesCopy
    });
  }
  const propertiesCopy = Array.from(existing.properties);
  propertiesCopy[propertyIndex] = createProperty(color);
  overridesCopy[currentIndex] = __spreadProps$g(__spreadValues$r({}, existing), {
    properties: propertiesCopy
  });
  return __spreadProps$g(__spreadValues$r({}, fieldConfig), {
    overrides: overridesCopy
  });
};
const createOverride = (label, color) => {
  return {
    matcher: {
      id: data.FieldMatcherID.byName,
      options: label
    },
    properties: [createProperty(color)]
  };
};
const createProperty = (color) => {
  return {
    id: "color",
    value: {
      mode: data.FieldColorModeId.Fixed,
      fixedColor: color
    }
  };
};

var __defProp$q = Object.defineProperty;
var __defProps$f = Object.defineProperties;
var __getOwnPropDescs$f = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$q = Object.getOwnPropertySymbols;
var __hasOwnProp$q = Object.prototype.hasOwnProperty;
var __propIsEnum$q = Object.prototype.propertyIsEnumerable;
var __defNormalProp$q = (obj, key, value) => key in obj ? __defProp$q(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$q = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$q.call(b, prop))
      __defNormalProp$q(a, prop, b[prop]);
  if (__getOwnPropSymbols$q)
    for (var prop of __getOwnPropSymbols$q(b)) {
      if (__propIsEnum$q.call(b, prop))
        __defNormalProp$q(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$f = (a, b) => __defProps$f(a, __getOwnPropDescs$f(b));
class VizPanel extends SceneObjectBase {
  constructor(state) {
    var _a;
    super(__spreadValues$q({
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      title: "Title",
      pluginId: "timeseries",
      _renderCounter: 0
    }, state));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["title", "options", "fieldConfig"]
    });
    this._structureRev = 0;
    this.onTimeRangeChange = (timeRange) => {
      const sceneTimeRange = sceneGraph.getTimeRange(this);
      sceneTimeRange.onTimeRangeChange({
        raw: {
          from: data.toUtc(timeRange.from),
          to: data.toUtc(timeRange.to)
        },
        from: data.toUtc(timeRange.from),
        to: data.toUtc(timeRange.to)
      });
    };
    this.getTimeRange = (data) => {
      const liveNowTimer = sceneGraph.findObject(this, (o) => o instanceof LiveNowTimer);
      const sceneTimeRange = sceneGraph.getTimeRange(this);
      if (liveNowTimer instanceof LiveNowTimer && liveNowTimer.isEnabled) {
        return evaluateTimeRange(
          sceneTimeRange.state.from,
          sceneTimeRange.state.to,
          sceneTimeRange.getTimeZone(),
          sceneTimeRange.state.fiscalYearStartMonth,
          sceneTimeRange.state.UNSAFE_nowDelay,
          sceneTimeRange.state.weekStart
        );
      }
      const plugin = this.getPlugin();
      if (plugin && !plugin.meta.skipDataQuery && data && data.timeRange) {
        return data.timeRange;
      }
      return sceneTimeRange.state.value;
    };
    this.onTitleChange = (title) => {
      this.setState({ title });
    };
    this.onDescriptionChange = (description) => {
      this.setState({ description });
    };
    this.onDisplayModeChange = (displayMode) => {
      this.setState({ displayMode });
    };
    this.onToggleCollapse = (collapsed) => {
      this.setState({
        collapsed
      });
    };
    this.onOptionsChange = (optionsUpdate, replace = false, isAfterPluginChange = false) => {
      var _a;
      const { fieldConfig, options } = this.state;
      const nextOptions = replace ? optionsUpdate : lodash.mergeWith(lodash.cloneDeep(options), optionsUpdate, (objValue, srcValue, key, obj) => {
        if (lodash.isArray(srcValue)) {
          return srcValue;
        }
        if (objValue !== srcValue && typeof srcValue === "undefined") {
          obj[key] = srcValue;
          return;
        }
        return;
      });
      const withDefaults = data.getPanelOptionsWithDefaults({
        plugin: this._plugin,
        currentOptions: nextOptions,
        currentFieldConfig: fieldConfig,
        isAfterPluginChange
      });
      this.setState({
        options: withDefaults.options,
        _renderCounter: ((_a = this.state._renderCounter) != null ? _a : 0) + 1
      });
    };
    this.onFieldConfigChange = (fieldConfigUpdate, replace) => {
      const { fieldConfig, options } = this.state;
      const nextFieldConfig = replace ? fieldConfigUpdate : lodash.merge(lodash.cloneDeep(fieldConfig), fieldConfigUpdate);
      const withDefaults = data.getPanelOptionsWithDefaults({
        plugin: this._plugin,
        currentOptions: options,
        currentFieldConfig: nextFieldConfig,
        isAfterPluginChange: false
      });
      this._dataWithFieldConfig = void 0;
      this.setState({ fieldConfig: withDefaults.fieldConfig });
    };
    this.interpolate = (value, scoped, format) => {
      return sceneGraph.interpolate(this, value, scoped, format);
    };
    this.getDescription = () => {
      this.publishEvent(new UserActionEvent({ origin: this, interaction: "panel-description-shown" }), true);
      const { description } = this.state;
      if (description) {
        const markdown = this.interpolate(description);
        return data.renderMarkdown(markdown);
      }
      return "";
    };
    this.onCancelQuery = () => {
      var _a;
      this.publishEvent(new UserActionEvent({ origin: this, interaction: "panel-cancel-query-clicked" }), true);
      const data = sceneGraph.getData(this);
      (_a = data.cancelQuery) == null ? void 0 : _a.call(data);
    };
    this.onStatusMessageClick = () => {
      this.publishEvent(new UserActionEvent({ origin: this, interaction: "panel-status-message-clicked" }), true);
    };
    this._onSeriesColorChange = (label, color) => {
      this.onFieldConfigChange(changeSeriesColorConfigFactory(label, color, this.state.fieldConfig));
    };
    this._onSeriesVisibilityChange = (label, mode) => {
      if (!this._dataWithFieldConfig) {
        return;
      }
      this.onFieldConfigChange(
        seriesVisibilityConfigFactory(label, mode, this.state.fieldConfig, this._dataWithFieldConfig.series),
        true
      );
    };
    this._onInstanceStateChange = (state) => {
      if (this._panelContext) {
        this._panelContext = __spreadProps$f(__spreadValues$q({}, this._panelContext), {
          instanceState: state
        });
      }
      this.setState({ _pluginInstanceState: state });
    };
    this._onToggleLegendSort = (sortKey) => {
      const legendOptions = this.state.options.legend;
      if (!legendOptions) {
        return;
      }
      let sortDesc = legendOptions.sortDesc;
      let sortBy = legendOptions.sortBy;
      if (sortKey !== sortBy) {
        sortDesc = void 0;
      }
      if (sortDesc === false) {
        sortBy = void 0;
        sortDesc = void 0;
      } else {
        sortDesc = !sortDesc;
        sortBy = sortKey;
      }
      this.onOptionsChange(
        __spreadProps$f(__spreadValues$q({}, this.state.options), {
          legend: __spreadProps$f(__spreadValues$q({}, legendOptions), { sortBy, sortDesc })
        }),
        true
      );
    };
    this.addActivationHandler(() => {
      this._onActivate();
    });
    (_a = state.menu) == null ? void 0 : _a.addActivationHandler(() => {
      this.publishEvent(new UserActionEvent({ origin: this, interaction: "panel-menu-shown" }), true);
    });
  }
  _onActivate() {
    if (!this._plugin) {
      this._loadPlugin(this.state.pluginId);
    }
  }
  forceRender() {
    var _a;
    this.setState({ _renderCounter: ((_a = this.state._renderCounter) != null ? _a : 0) + 1 });
  }
  async _loadPlugin(pluginId, overwriteOptions, overwriteFieldConfig, isAfterPluginChange) {
    const plugin = loadPanelPluginSync(pluginId);
    if (plugin) {
      this._pluginLoaded(plugin, overwriteOptions, overwriteFieldConfig, isAfterPluginChange);
    } else {
      const { importPanelPlugin } = runtime.getPluginImportUtils();
      try {
        const result = await importPanelPlugin(pluginId);
        this._pluginLoaded(result, overwriteOptions, overwriteFieldConfig, isAfterPluginChange);
      } catch (err) {
        this._pluginLoaded(getPanelPluginNotFound(pluginId));
        if (err instanceof Error) {
          this.setState({ _pluginLoadError: err.message });
        }
      }
    }
  }
  getLegacyPanelId() {
    const panelId = parseInt(this.state.key.replace("panel-", ""), 10);
    if (isNaN(panelId)) {
      return 0;
    }
    return panelId;
  }
  async _pluginLoaded(plugin, overwriteOptions, overwriteFieldConfig, isAfterPluginChange) {
    const { options, fieldConfig, title, pluginVersion, _UNSAFE_customMigrationHandler } = this.state;
    const panel = {
      title,
      options,
      fieldConfig,
      id: this.getLegacyPanelId(),
      type: plugin.meta.id,
      pluginVersion
    };
    if (overwriteOptions) {
      panel.options = overwriteOptions;
    }
    if (overwriteFieldConfig) {
      panel.fieldConfig = overwriteFieldConfig;
    }
    const currentVersion = this._getPluginVersion(plugin);
    _UNSAFE_customMigrationHandler == null ? void 0 : _UNSAFE_customMigrationHandler(panel, plugin);
    if (plugin.onPanelMigration && currentVersion !== pluginVersion && !isAfterPluginChange) {
      panel.options = await plugin.onPanelMigration(panel);
    }
    const withDefaults = data.getPanelOptionsWithDefaults({
      plugin,
      currentOptions: panel.options,
      currentFieldConfig: panel.fieldConfig,
      isAfterPluginChange: isAfterPluginChange != null ? isAfterPluginChange : false
    });
    this._plugin = plugin;
    this.setState({
      options: withDefaults.options,
      fieldConfig: withDefaults.fieldConfig,
      pluginVersion: currentVersion,
      pluginId: plugin.meta.id
    });
    if (plugin.meta.skipDataQuery) {
      const sceneTimeRange = sceneGraph.getTimeRange(this);
      this._subs.add(sceneTimeRange.subscribeToState(() => this.forceRender()));
    }
  }
  _getPluginVersion(plugin) {
    return plugin && plugin.meta.info.version ? plugin.meta.info.version : runtime.config.buildInfo.version;
  }
  getPlugin() {
    return this._plugin;
  }
  getPanelContext() {
    var _a;
    (_a = this._panelContext) != null ? _a : this._panelContext = this.buildPanelContext();
    return this._panelContext;
  }
  async changePluginType(pluginId, newOptions, newFieldConfig) {
    var _a, _b;
    const { options: prevOptions, fieldConfig: prevFieldConfig, pluginId: prevPluginId } = this.state;
    this._dataWithFieldConfig = void 0;
    const isAfterPluginChange = this.state.pluginId !== pluginId;
    await this._loadPlugin(pluginId, newOptions != null ? newOptions : {}, newFieldConfig, isAfterPluginChange);
    const panel = {
      title: this.state.title,
      options: this.state.options,
      fieldConfig: this.state.fieldConfig,
      id: 1,
      type: pluginId
    };
    const updatedOptions = (_b = (_a = this._plugin) == null ? void 0 : _a.onPanelTypeChanged) == null ? void 0 : _b.call(_a, panel, prevPluginId, prevOptions, prevFieldConfig);
    if (updatedOptions && !lodash.isEmpty(updatedOptions)) {
      this.onOptionsChange(updatedOptions, true, true);
    }
  }
  clearFieldConfigCache() {
    this._dataWithFieldConfig = void 0;
  }
  applyFieldConfig(rawData) {
    var _a, _b, _c, _d;
    const plugin = this._plugin;
    if (!plugin || plugin.meta.skipDataQuery || !rawData) {
      return emptyPanelData;
    }
    if (this._prevData === rawData && this._dataWithFieldConfig) {
      return this._dataWithFieldConfig;
    }
    const pluginDataSupport = plugin.dataSupport || { alertStates: false, annotations: false };
    const fieldConfigRegistry = plugin.fieldConfigRegistry;
    const prevFrames = (_b = (_a = this._dataWithFieldConfig) == null ? void 0 : _a.series) != null ? _b : [];
    const newFrames = data.applyFieldOverrides({
      data: rawData.series,
      fieldConfig: this.state.fieldConfig,
      fieldConfigRegistry,
      replaceVariables: this.interpolate,
      theme: runtime.config.theme2,
      timeZone: (_c = rawData.request) == null ? void 0 : _c.timezone
    });
    if (!data.compareArrayValues(newFrames, prevFrames, data.compareDataFrameStructures)) {
      this._structureRev++;
    }
    this._dataWithFieldConfig = __spreadProps$f(__spreadValues$q({}, rawData), {
      structureRev: this._structureRev,
      series: newFrames
    });
    if (this._dataWithFieldConfig.annotations) {
      this._dataWithFieldConfig.annotations = data.applyFieldOverrides({
        data: this._dataWithFieldConfig.annotations,
        fieldConfig: {
          defaults: {},
          overrides: []
        },
        fieldConfigRegistry,
        replaceVariables: this.interpolate,
        theme: runtime.config.theme2,
        timeZone: (_d = rawData.request) == null ? void 0 : _d.timezone
      });
    }
    if (!pluginDataSupport.alertStates) {
      this._dataWithFieldConfig.alertState = void 0;
    }
    if (!pluginDataSupport.annotations) {
      this._dataWithFieldConfig.annotations = void 0;
    }
    this._prevData = rawData;
    return this._dataWithFieldConfig;
  }
  buildPanelContext() {
    const sync = getCursorSyncScope(this);
    const context = {
      eventsScope: sync ? sync.getEventsScope() : "__global_",
      eventBus: sync ? sync.getEventsBus(this) : runtime.getAppEvents(),
      app: data.CoreApp.Unknown,
      sync: () => {
        if (sync) {
          return sync.state.sync;
        }
        return data.DashboardCursorSync.Off;
      },
      onSeriesColorChange: this._onSeriesColorChange,
      onToggleSeriesVisibility: this._onSeriesVisibilityChange,
      onToggleLegendSort: this._onToggleLegendSort,
      onInstanceStateChange: this._onInstanceStateChange
    };
    if (this.state.extendPanelContext) {
      this.state.extendPanelContext(this, context);
    }
    return context;
  }
}
VizPanel.Component = VizPanelRenderer;
function getPanelPluginNotFound(id) {
  const plugin = new data.PanelPlugin(() => null);
  plugin.meta = {
    id,
    name: id,
    sort: 100,
    type: data.PluginType.panel,
    module: "",
    baseUrl: "",
    info: {
      author: {
        name: ""
      },
      description: "",
      links: [],
      logos: {
        large: "",
        small: "public/img/grafana_icon.svg"
      },
      screenshots: [],
      updated: "",
      version: ""
    }
  };
  return plugin;
}

const _LiveNowTimer = class extends SceneObjectBase {
  constructor({ enabled = false }) {
    super({ enabled });
    this.timerId = void 0;
    this._activationHandler = () => {
      if (this.state.enabled) {
        this.enable();
      }
      return () => {
        window.clearInterval(this.timerId);
        this.timerId = void 0;
      };
    };
    this.addActivationHandler(this._activationHandler);
  }
  enable() {
    window.clearInterval(this.timerId);
    this.timerId = void 0;
    this.timerId = window.setInterval(() => {
      const panels = sceneGraph.findAllObjects(this.getRoot(), (obj) => obj instanceof VizPanel);
      for (const panel of panels) {
        panel.forceRender();
      }
    }, _LiveNowTimer.REFRESH_RATE);
    this.setState({ enabled: true });
  }
  disable() {
    window.clearInterval(this.timerId);
    this.timerId = void 0;
    this.setState({ enabled: false });
  }
  get isEnabled() {
    return this.state.enabled;
  }
};
let LiveNowTimer = _LiveNowTimer;
LiveNowTimer.REFRESH_RATE = 100;

var index$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ActWhenVariableChanged: ActWhenVariableChanged,
  CursorSync: CursorSync,
  SceneQueryController: SceneQueryController,
  LiveNowTimer: LiveNowTimer
});

function getMessageFromError(err) {
  if (typeof err === "string") {
    return err;
  }
  if (err) {
    if (err instanceof Error) {
      return err.message;
    } else if (runtime.isFetchError(err)) {
      if (err.data && err.data.message) {
        return err.data.message;
      } else if (err.statusText) {
        return err.statusText;
      }
    } else if (err.hasOwnProperty("message")) {
      return err.message;
    }
  }
  return JSON.stringify(err);
}

var __defProp$p = Object.defineProperty;
var __getOwnPropSymbols$p = Object.getOwnPropertySymbols;
var __hasOwnProp$p = Object.prototype.hasOwnProperty;
var __propIsEnum$p = Object.prototype.propertyIsEnumerable;
var __defNormalProp$p = (obj, key, value) => key in obj ? __defProp$p(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$p = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$p.call(b, prop))
      __defNormalProp$p(a, prop, b[prop]);
  if (__getOwnPropSymbols$p)
    for (var prop of __getOwnPropSymbols$p(b)) {
      if (__propIsEnum$p.call(b, prop))
        __defNormalProp$p(a, prop, b[prop]);
    }
  return a;
};
class SceneDataLayerBase extends SceneObjectBase {
  constructor(initialState, variableDependencyStatePaths = []) {
    super(__spreadValues$p({
      isEnabled: true
    }, initialState));
    this._results = new rxjs.ReplaySubject(1);
    this.isDataLayer = true;
    this._variableValueRecorder = new VariableValueRecorder();
    this._variableDependency = new VariableDependencyConfig(this, {
      onVariableUpdateCompleted: this.onVariableUpdateCompleted.bind(this)
    });
    this._variableDependency.setPaths(variableDependencyStatePaths);
    this.addActivationHandler(() => this.onActivate());
  }
  onActivate() {
    if (this.state.isEnabled) {
      this.onEnable();
    }
    if (this.shouldRunLayerOnActivate()) {
      this.runLayer();
    }
    this.subscribeToState((n, p) => {
      if (!n.isEnabled && this.querySub) {
        this.querySub.unsubscribe();
        this.querySub = void 0;
        this.onDisable();
        this._results.next({ origin: this, data: emptyPanelData });
        this.setStateHelper({ data: emptyPanelData });
      }
      if (n.isEnabled && !p.isEnabled) {
        this.onEnable();
        this.runLayer();
      }
    });
    return () => {
      this.onDeactivate();
    };
  }
  onDeactivate() {
    if (this.querySub) {
      this.querySub.unsubscribe();
      this.querySub = void 0;
    }
    this.onDisable();
    this._variableValueRecorder.recordCurrentDependencyValuesForSceneObject(this);
  }
  onVariableUpdateCompleted() {
    this.runLayer();
  }
  cancelQuery() {
    if (this.querySub) {
      this.querySub.unsubscribe();
      this.querySub = void 0;
      this.publishResults(emptyPanelData);
    }
  }
  publishResults(data) {
    if (this.state.isEnabled) {
      this._results.next({ origin: this, data });
      this.setStateHelper({ data });
    }
  }
  getResultsStream() {
    return this._results;
  }
  shouldRunLayerOnActivate() {
    if (!this.state.isEnabled) {
      return false;
    }
    if (this._variableValueRecorder.hasDependenciesChanged(this)) {
      writeSceneLog(
        "SceneDataLayerBase",
        "Variable dependency changed while inactive, shouldRunLayerOnActivate returns true"
      );
      return true;
    }
    if (!this.state.data) {
      return true;
    }
    return false;
  }
  setStateHelper(state) {
    setBaseClassState(this, state);
  }
}

class SceneDataLayerControls extends SceneObjectBase {
  constructor() {
    super({});
  }
}
SceneDataLayerControls.Component = SceneDataLayerControlsRenderer;
function SceneDataLayerControlsRenderer({ model }) {
  const layers = sceneGraph.getDataLayers(model, true);
  if (layers.length === 0) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, layers.map((layer) => /* @__PURE__ */ React__default["default"].createElement(layer.Component, {
    model: layer,
    key: layer.state.key
  })));
}
function DataLayerControlSwitch({ layer }) {
  var _a, _b;
  const elementId = `data-layer-${layer.state.key}`;
  const { data, isEnabled } = layer.useState();
  const showLoading = Boolean(data && data.state === schema.LoadingState.Loading);
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: containerStyle$1
  }, /* @__PURE__ */ React__default["default"].createElement(ControlsLabel, {
    htmlFor: elementId,
    isLoading: showLoading,
    onCancel: () => {
      var _a2;
      return (_a2 = layer.cancelQuery) == null ? void 0 : _a2.call(layer);
    },
    label: layer.state.name,
    description: layer.state.description,
    error: (_b = (_a = layer.state.data) == null ? void 0 : _a.errors) == null ? void 0 : _b[0].message
  }), /* @__PURE__ */ React__default["default"].createElement(ui.InlineSwitch, {
    id: elementId,
    value: isEnabled,
    onChange: () => layer.setState({ isEnabled: !isEnabled })
  }));
}
const containerStyle$1 = css.css({ display: "flex" });

var __defProp$o = Object.defineProperty;
var __defProps$e = Object.defineProperties;
var __getOwnPropDescs$e = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$o = Object.getOwnPropertySymbols;
var __hasOwnProp$o = Object.prototype.hasOwnProperty;
var __propIsEnum$o = Object.prototype.propertyIsEnumerable;
var __defNormalProp$o = (obj, key, value) => key in obj ? __defProp$o(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$o = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$o.call(b, prop))
      __defNormalProp$o(a, prop, b[prop]);
  if (__getOwnPropSymbols$o)
    for (var prop of __getOwnPropSymbols$o(b)) {
      if (__propIsEnum$o.call(b, prop))
        __defNormalProp$o(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$e = (a, b) => __defProps$e(a, __getOwnPropDescs$e(b));
var __objRest$2 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$o.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$o)
    for (var prop of __getOwnPropSymbols$o(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$o.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const standardAnnotationSupport = {
  prepareAnnotation: (json) => {
    if (lodash.isString(json == null ? void 0 : json.query)) {
      const _a = json, { query } = _a, rest = __objRest$2(_a, ["query"]);
      return __spreadProps$e(__spreadValues$o({}, rest), {
        target: {
          refId: "annotation_query",
          query
        },
        mappings: {}
      });
    }
    return json;
  },
  prepareQuery: (anno) => anno.target,
  processEvents: (anno, data) => {
    return getAnnotationsFromData(data, anno.mappings);
  }
};
function singleFrameFromPanelData() {
  return (source) => source.pipe(
    operators.mergeMap((data$1) => {
      if (!(data$1 == null ? void 0 : data$1.length)) {
        return rxjs.of(void 0);
      }
      if (data$1.length === 1) {
        return rxjs.of(data$1[0]);
      }
      const ctx = {
        interpolate: (v) => v
      };
      return rxjs.of(data$1).pipe(
        data.standardTransformers.mergeTransformer.operator({}, ctx),
        operators.map((d) => d[0])
      );
    })
  );
}
const annotationEventNames = [
  {
    key: "time",
    field: (frame) => frame.fields.find((f) => f.type === data.FieldType.time),
    placeholder: "time, or the first time field"
  },
  { key: "timeEnd", help: "When this field is defined, the annotation will be treated as a range" },
  {
    key: "title"
  },
  {
    key: "text",
    field: (frame) => frame.fields.find((f) => f.type === data.FieldType.string),
    placeholder: "text, or the first text field"
  },
  { key: "tags", split: ",", help: "The results will be split on comma (,)" },
  {
    key: "id"
  }
];
const publicDashboardEventNames = [
  {
    key: "color"
  },
  {
    key: "isRegion"
  },
  {
    key: "source"
  }
];
const alertEventAndAnnotationFields = [
  ...runtime.config.publicDashboardAccessToken ? publicDashboardEventNames : [],
  ...annotationEventNames,
  { key: "userId" },
  { key: "login" },
  { key: "email" },
  { key: "prevState" },
  { key: "newState" },
  { key: "data" },
  { key: "panelId" },
  { key: "alertId" },
  { key: "dashboardId" },
  { key: "dashboardUID" }
];
function getAnnotationsFromData(data$1, options) {
  return rxjs.of(data$1).pipe(
    singleFrameFromPanelData(),
    operators.map((frame) => {
      if (!(frame == null ? void 0 : frame.length)) {
        return [];
      }
      let hasTime = false;
      let hasText = false;
      const byName = {};
      for (const f of frame.fields) {
        const name = data.getFieldDisplayName(f, frame);
        byName[name.toLowerCase()] = f;
      }
      if (!options) {
        options = {};
      }
      const fields = [];
      for (const evts of alertEventAndAnnotationFields) {
        const opt = options[evts.key] || {};
        if (opt.source === data.AnnotationEventFieldSource.Skip) {
          continue;
        }
        const setter = { key: evts.key, split: evts.split };
        if (opt.source === data.AnnotationEventFieldSource.Text) {
          setter.text = opt.value;
        } else {
          const lower = (opt.value || evts.key).toLowerCase();
          setter.field = byName[lower];
          if (!setter.field && evts.field) {
            setter.field = evts.field(frame);
          }
        }
        if (setter.field || setter.text) {
          fields.push(setter);
          if (setter.key === "time") {
            hasTime = true;
          } else if (setter.key === "text") {
            hasText = true;
          }
        }
      }
      if (!hasTime || !hasText) {
        console.error("Cannot process annotation fields. No time or text present.");
        return [];
      }
      const events = [];
      for (let i = 0; i < frame.length; i++) {
        const anno = {
          type: "default",
          color: "red"
        };
        for (const f of fields) {
          let v = void 0;
          if (f.text) {
            v = f.text;
          } else if (f.field) {
            v = f.field.values.get(i);
            if (v !== void 0 && f.regex) {
              const match = f.regex.exec(v);
              if (match) {
                v = match[1] ? match[1] : match[0];
              }
            }
          }
          if (v !== null && v !== void 0) {
            if (f.split && typeof v === "string") {
              v = v.split(",");
            }
            anno[f.key] = v;
          }
        }
        events.push(anno);
      }
      return events;
    })
  );
}
const legacyRunner = [
  "prometheus",
  "loki",
  "elasticsearch",
  "grafana-opensearch-datasource"
];
function shouldUseLegacyRunner(datasource) {
  const { type } = datasource;
  return !datasource.annotations || legacyRunner.includes(type);
}

var __defProp$n = Object.defineProperty;
var __defProps$d = Object.defineProperties;
var __getOwnPropDescs$d = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$n = Object.getOwnPropertySymbols;
var __hasOwnProp$n = Object.prototype.hasOwnProperty;
var __propIsEnum$n = Object.prototype.propertyIsEnumerable;
var __defNormalProp$n = (obj, key, value) => key in obj ? __defProp$n(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$n = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$n.call(b, prop))
      __defNormalProp$n(a, prop, b[prop]);
  if (__getOwnPropSymbols$n)
    for (var prop of __getOwnPropSymbols$n(b)) {
      if (__propIsEnum$n.call(b, prop))
        __defNormalProp$n(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$d = (a, b) => __defProps$d(a, __getOwnPropDescs$d(b));
let counter = 100;
function getNextRequestId() {
  return "AQ" + counter++;
}
function executeAnnotationQuery(datasource, timeRange, query, layer) {
  var _a;
  if (datasource.annotationQuery && shouldUseLegacyRunner(datasource)) {
    console.warn("Using deprecated annotationQuery method, please upgrade your datasource");
    return rxjs.from(
      datasource.annotationQuery({
        range: timeRange.state.value,
        rangeRaw: timeRange.state.value.raw,
        annotation: query,
        dashboard: {
          getVariables: runtime.getTemplateSrv().getVariables
        }
      })
    ).pipe(
      operators.map((events) => ({
        state: schema.LoadingState.Done,
        events
      }))
    );
  }
  const processor = __spreadValues$n(__spreadValues$n({}, standardAnnotationSupport), datasource.annotations);
  const annotationWithDefaults = __spreadValues$n(__spreadValues$n({}, (_a = processor.getDefaultQuery) == null ? void 0 : _a.call(processor)), query);
  const annotation = processor.prepareAnnotation(annotationWithDefaults);
  if (!annotation) {
    return rxjs.of({
      state: schema.LoadingState.Done,
      events: []
    });
  }
  const processedQuery = processor.prepareQuery(annotation);
  if (!processedQuery) {
    return rxjs.of({
      state: schema.LoadingState.Done,
      events: []
    });
  }
  const maxDataPoints = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const interval = data.rangeUtil.calculateInterval(timeRange.state.value, maxDataPoints, datasource.interval);
  const scopedVars = {
    __interval: { text: interval.interval, value: interval.interval },
    __interval_ms: { text: interval.intervalMs.toString(), value: interval.intervalMs },
    __annotation: { text: annotation.name, value: annotation },
    __sceneObject: wrapInSafeSerializableSceneObject(layer)
  };
  const queryRequest = __spreadValues$n(__spreadProps$d(__spreadValues$n({
    startTime: Date.now(),
    requestId: getNextRequestId(),
    range: timeRange.state.value,
    maxDataPoints,
    scopedVars
  }, interval), {
    app: data.CoreApp.Dashboard,
    timezone: timeRange.getTimeZone(),
    targets: [
      __spreadProps$d(__spreadValues$n({}, processedQuery), {
        refId: "Anno"
      })
    ]
  }), getEnrichedDataRequest(layer));
  const runRequest = runtime.getRunRequest();
  return runRequest(datasource, queryRequest).pipe(
    operators.mergeMap((panelData) => {
      const data$1 = (panelData == null ? void 0 : panelData.series.length) ? panelData.series : panelData.annotations;
      if (!(data$1 == null ? void 0 : data$1.length)) {
        return rxjs.of({
          state: panelData.state,
          events: []
        });
      }
      data$1.forEach((frame) => {
        var _a2;
        if (!((_a2 = frame.meta) == null ? void 0 : _a2.dataTopic)) {
          frame.meta = __spreadProps$d(__spreadValues$n({}, frame.meta || {}), { dataTopic: data.DataTopic.Annotations });
        }
      });
      return processor.processEvents(annotation, data$1).pipe(
        operators.map((events) => {
          return {
            state: panelData.state,
            events: events || []
          };
        })
      );
    })
  );
}

var __defProp$m = Object.defineProperty;
var __getOwnPropSymbols$m = Object.getOwnPropertySymbols;
var __hasOwnProp$m = Object.prototype.hasOwnProperty;
var __propIsEnum$m = Object.prototype.propertyIsEnumerable;
var __defNormalProp$m = (obj, key, value) => key in obj ? __defProp$m(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$m = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$m.call(b, prop))
      __defNormalProp$m(a, prop, b[prop]);
  if (__getOwnPropSymbols$m)
    for (var prop of __getOwnPropSymbols$m(b)) {
      if (__propIsEnum$m.call(b, prop))
        __defNormalProp$m(a, prop, b[prop]);
    }
  return a;
};
function postProcessQueryResult(annotation, results) {
  if (annotation.snapshotData) {
    annotation = lodash.cloneDeep(annotation);
    delete annotation.snapshotData;
  }
  const processed = results.map((item) => {
    var _a;
    const processedItem = __spreadValues$m({}, item);
    processedItem.source = annotation;
    processedItem.color = runtime.config.theme2.visualization.getColorByName(annotation.iconColor);
    processedItem.type = annotation.name;
    processedItem.isRegion = Boolean(processedItem.timeEnd && processedItem.time !== processedItem.timeEnd);
    switch ((_a = processedItem.newState) == null ? void 0 : _a.toLowerCase()) {
      case "pending":
        processedItem.color = "yellow";
        break;
      case "alerting":
        processedItem.color = "red";
        break;
      case "ok":
        processedItem.color = "green";
        break;
      case "normal":
        processedItem.color = "green";
        break;
      case "no_data":
        processedItem.color = "gray";
        break;
      case "nodata":
        processedItem.color = "gray";
        break;
    }
    return processedItem;
  });
  return processed;
}
function dedupAnnotations(annotations) {
  let dedup = [];
  const events = lodash.partition(annotations, "id");
  const eventsById = lodash.groupBy(events[0], "id");
  dedup = lodash.map(eventsById, (eventGroup) => {
    if (eventGroup.length > 1 && !lodash.every(eventGroup, isPanelAlert)) {
      return lodash.find(eventGroup, (event) => {
        return event.eventType !== "panel-alert";
      });
    } else {
      return lodash.head(eventGroup);
    }
  });
  dedup = lodash.concat(dedup, events[1]);
  return dedup;
}
function isPanelAlert(event) {
  return event.eventType === "panel-alert";
}

var __defProp$l = Object.defineProperty;
var __defProps$c = Object.defineProperties;
var __getOwnPropDescs$c = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$l = Object.getOwnPropertySymbols;
var __hasOwnProp$l = Object.prototype.hasOwnProperty;
var __propIsEnum$l = Object.prototype.propertyIsEnumerable;
var __defNormalProp$l = (obj, key, value) => key in obj ? __defProp$l(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$l = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$l.call(b, prop))
      __defNormalProp$l(a, prop, b[prop]);
  if (__getOwnPropSymbols$l)
    for (var prop of __getOwnPropSymbols$l(b)) {
      if (__propIsEnum$l.call(b, prop))
        __defNormalProp$l(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$c = (a, b) => __defProps$c(a, __getOwnPropDescs$c(b));
class AnnotationsDataLayer extends SceneDataLayerBase {
  constructor(initialState) {
    super(
      __spreadValues$l({
        isEnabled: true
      }, initialState),
      ["query"]
    );
    this._scopedVars = {
      __sceneObject: wrapInSafeSerializableSceneObject(this)
    };
  }
  onEnable() {
    this.publishEvent(new runtime.RefreshEvent(), true);
    const timeRange = sceneGraph.getTimeRange(this);
    this._timeRangeSub = timeRange.subscribeToState(() => {
      this.runWithTimeRange(timeRange);
    });
  }
  onDisable() {
    var _a;
    this.publishEvent(new runtime.RefreshEvent(), true);
    (_a = this._timeRangeSub) == null ? void 0 : _a.unsubscribe();
  }
  runLayer() {
    writeSceneLog("AnnotationsDataLayer", "run layer");
    const timeRange = sceneGraph.getTimeRange(this);
    this.runWithTimeRange(timeRange);
  }
  async runWithTimeRange(timeRange) {
    const { query } = this.state;
    if (this.querySub) {
      this.querySub.unsubscribe();
    }
    if (this._variableDependency.hasDependencyInLoadingState()) {
      writeSceneLog("AnnotationsDataLayer", "Variable dependency is in loading state, skipping query execution");
      return;
    }
    try {
      const ds = await this.resolveDataSource(query);
      let stream = executeAnnotationQuery(ds, timeRange, query, this).pipe(
        registerQueryWithController({
          type: "annotations",
          origin: this,
          cancel: () => this.cancelQuery()
        }),
        rxjs.map((events) => {
          const stateUpdate = this.processEvents(query, events);
          return stateUpdate;
        })
      );
      this.querySub = stream.subscribe((stateUpdate) => {
        this.publishResults(stateUpdate);
      });
    } catch (e) {
      this.publishResults(__spreadProps$c(__spreadValues$l({}, emptyPanelData), {
        state: schema.LoadingState.Error,
        errors: [
          {
            message: getMessageFromError(e)
          }
        ]
      }));
      console.error("AnnotationsDataLayer error", e);
    }
  }
  async resolveDataSource(query) {
    return await getDataSource(query.datasource || void 0, this._scopedVars);
  }
  processEvents(query, events) {
    let processedEvents = postProcessQueryResult(query, events.events || []);
    processedEvents = dedupAnnotations(processedEvents);
    const stateUpdate = __spreadProps$c(__spreadValues$l({}, emptyPanelData), { state: events.state });
    const df = data.arrayToDataFrame(processedEvents);
    df.meta = __spreadProps$c(__spreadValues$l({}, df.meta), {
      dataTopic: data.DataTopic.Annotations
    });
    stateUpdate.series = [df];
    return stateUpdate;
  }
}
AnnotationsDataLayer.Component = AnnotationsDataLayerRenderer;
function AnnotationsDataLayerRenderer({ model }) {
  const { isHidden } = model.useState();
  if (isHidden) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement(DataLayerControlSwitch, {
    layer: model
  });
}

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AnnotationsDataLayer: AnnotationsDataLayer
});

class SceneTimeRangeTransformerBase extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._activationHandler = () => {
      const ancestorTimeRange = this.getAncestorTimeRange();
      this.ancestorTimeRangeChanged(ancestorTimeRange.state);
      this._subs.add(ancestorTimeRange.subscribeToState((s) => this.ancestorTimeRangeChanged(s)));
    };
    this.addActivationHandler(this._activationHandler);
  }
  getAncestorTimeRange() {
    if (!this.parent || !this.parent.parent) {
      throw new Error(typeof this + " must be used within $timeRange scope");
    }
    return sceneGraph.getTimeRange(this.parent.parent);
  }
  getTimeZone() {
    return this.getAncestorTimeRange().getTimeZone();
  }
  onTimeRangeChange(timeRange) {
    this.getAncestorTimeRange().onTimeRangeChange(timeRange);
  }
  onTimeZoneChange(timeZone) {
    this.getAncestorTimeRange().onTimeZoneChange(timeZone);
  }
  onRefresh() {
    this.getAncestorTimeRange().onRefresh();
  }
}

var __defProp$k = Object.defineProperty;
var __defProps$b = Object.defineProperties;
var __getOwnPropDescs$b = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$k = Object.getOwnPropertySymbols;
var __hasOwnProp$k = Object.prototype.hasOwnProperty;
var __propIsEnum$k = Object.prototype.propertyIsEnumerable;
var __defNormalProp$k = (obj, key, value) => key in obj ? __defProp$k(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$k = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$k.call(b, prop))
      __defNormalProp$k(a, prop, b[prop]);
  if (__getOwnPropSymbols$k)
    for (var prop of __getOwnPropSymbols$k(b)) {
      if (__propIsEnum$k.call(b, prop))
        __defNormalProp$k(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$b = (a, b) => __defProps$b(a, __getOwnPropDescs$b(b));
class SceneTimeZoneOverride extends SceneTimeRangeTransformerBase {
  constructor(state) {
    super(__spreadProps$b(__spreadValues$k({}, state), {
      timeZone: state.timeZone,
      from: "now-6h",
      to: "now",
      value: data.getDefaultTimeRange()
    }));
  }
  ancestorTimeRangeChanged(timeRange) {
    this.setState(__spreadProps$b(__spreadValues$k({}, timeRange), {
      timeZone: this.state.timeZone,
      value: evaluateTimeRange(
        timeRange.from,
        timeRange.to,
        this.state.timeZone,
        timeRange.fiscalYearStartMonth,
        timeRange.UNSAFE_nowDelay,
        timeRange.weekStart
      )
    }));
  }
  getTimeZone() {
    return this.state.timeZone;
  }
  onTimeZoneChange(timeZone) {
    const parentTimeRange = this.getAncestorTimeRange();
    this.setState({
      timeZone,
      value: evaluateTimeRange(
        parentTimeRange.state.from,
        parentTimeRange.state.to,
        timeZone,
        parentTimeRange.state.fiscalYearStartMonth,
        parentTimeRange.state.UNSAFE_nowDelay,
        parentTimeRange.state.weekStart
      )
    });
  }
}

class DataProviderProxy extends SceneObjectBase {
  constructor(state) {
    super({
      source: state.source,
      data: state.source.resolve().state.data
    });
    this.addActivationHandler(() => {
      this._subs.add(
        this.state.source.resolve().subscribeToState((newState, oldState) => {
          if (newState.data !== oldState.data) {
            this.setState({ data: newState.data });
          }
        })
      );
    });
  }
  setContainerWidth(width) {
    var _a, _b;
    (_b = (_a = this.state.source.resolve()).setContainerWidth) == null ? void 0 : _b.call(_a, width);
  }
  isDataReadyToDisplay() {
    var _a, _b, _c;
    return (_c = (_b = (_a = this.state.source.resolve()).isDataReadyToDisplay) == null ? void 0 : _b.call(_a)) != null ? _c : true;
  }
  cancelQuery() {
    var _a, _b;
    (_b = (_a = this.state.source.resolve()).cancelQuery) == null ? void 0 : _b.call(_a);
  }
  getResultsStream() {
    return this.state.source.resolve().getResultsStream();
  }
}

var __defProp$j = Object.defineProperty;
var __defProps$a = Object.defineProperties;
var __getOwnPropDescs$a = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$j = Object.getOwnPropertySymbols;
var __hasOwnProp$j = Object.prototype.hasOwnProperty;
var __propIsEnum$j = Object.prototype.propertyIsEnumerable;
var __defNormalProp$j = (obj, key, value) => key in obj ? __defProp$j(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$j = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$j.call(b, prop))
      __defNormalProp$j(a, prop, b[prop]);
  if (__getOwnPropSymbols$j)
    for (var prop of __getOwnPropSymbols$j(b)) {
      if (__propIsEnum$j.call(b, prop))
        __defNormalProp$j(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$a = (a, b) => __defProps$a(a, __getOwnPropDescs$a(b));
class SceneDataLayerSetBase extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this.isDataLayer = true;
    this._results = new rxjs.ReplaySubject(1);
    this._dataLayersMerger = new DataLayersMerger();
  }
  subscribeToAllLayers(layers) {
    if (layers.length > 0) {
      this.querySub = this._dataLayersMerger.getMergedStream(layers).subscribe(this._onLayerUpdateReceived.bind(this));
    } else {
      this._results.next({ origin: this, data: emptyPanelData });
      this.setStateHelper({ data: emptyPanelData });
    }
  }
  _onLayerUpdateReceived(results) {
    var _a;
    let series = [];
    for (const result of results) {
      if ((_a = result.data) == null ? void 0 : _a.series) {
        series = series.concat(result.data.series);
      }
    }
    const combinedData = __spreadProps$a(__spreadValues$j({}, emptyPanelData), { series });
    this._results.next({ origin: this, data: combinedData });
    this.setStateHelper({ data: combinedData });
  }
  getResultsStream() {
    return this._results;
  }
  cancelQuery() {
    var _a;
    (_a = this.querySub) == null ? void 0 : _a.unsubscribe();
  }
  setStateHelper(state) {
    setBaseClassState(this, state);
  }
}
class SceneDataLayerSet extends SceneDataLayerSetBase {
  constructor(state) {
    var _a, _b;
    super({
      name: (_a = state.name) != null ? _a : "Data layers",
      layers: (_b = state.layers) != null ? _b : []
    });
    this.addActivationHandler(() => this._onActivate());
  }
  _onActivate() {
    this._subs.add(
      this.subscribeToState((newState, oldState) => {
        var _a;
        if (newState.layers !== oldState.layers) {
          (_a = this.querySub) == null ? void 0 : _a.unsubscribe();
          this.subscribeToAllLayers(newState.layers);
        }
      })
    );
    this.subscribeToAllLayers(this.state.layers);
    return () => {
      var _a;
      (_a = this.querySub) == null ? void 0 : _a.unsubscribe();
    };
  }
}
SceneDataLayerSet.Component = ({ model }) => {
  const { layers } = model.useState();
  return /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, layers.map((layer) => /* @__PURE__ */ React__default["default"].createElement(layer.Component, {
    model: layer,
    key: layer.state.key
  })));
};

var __defProp$i = Object.defineProperty;
var __defProps$9 = Object.defineProperties;
var __getOwnPropDescs$9 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$i = Object.getOwnPropertySymbols;
var __hasOwnProp$i = Object.prototype.hasOwnProperty;
var __propIsEnum$i = Object.prototype.propertyIsEnumerable;
var __defNormalProp$i = (obj, key, value) => key in obj ? __defProp$i(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$i = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$i.call(b, prop))
      __defNormalProp$i(a, prop, b[prop]);
  if (__getOwnPropSymbols$i)
    for (var prop of __getOwnPropSymbols$i(b)) {
      if (__propIsEnum$i.call(b, prop))
        __defNormalProp$i(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$9 = (a, b) => __defProps$9(a, __getOwnPropDescs$9(b));
class SceneDataTransformer extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._results = new rxjs.ReplaySubject(1);
    this._variableDependency = new VariableDependencyConfig(
      this,
      {
        statePaths: ["transformations"],
        onReferencedVariableValueChanged: () => this.reprocessTransformations()
      }
    );
    this.addActivationHandler(() => this.activationHandler());
  }
  activationHandler() {
    const sourceData = this.getSourceData();
    this._subs.add(sourceData.subscribeToState((state) => this.transform(state.data)));
    if (sourceData.state.data) {
      this.transform(sourceData.state.data);
    }
    return () => {
      if (this._transformSub) {
        this._transformSub.unsubscribe();
      }
    };
  }
  getSourceData() {
    if (this.state.$data) {
      if (this.state.$data instanceof SceneDataLayerSet) {
        throw new Error("SceneDataLayerSet can not be used as data provider for SceneDataTransformer.");
      }
      return this.state.$data;
    }
    if (!this.parent || !this.parent.parent) {
      throw new Error("SceneDataTransformer must either have $data set on it or have a parent.parent with $data");
    }
    return sceneGraph.getData(this.parent.parent);
  }
  setContainerWidth(width) {
    if (this.state.$data && this.state.$data.setContainerWidth) {
      this.state.$data.setContainerWidth(width);
    }
  }
  isDataReadyToDisplay() {
    const dataObject = this.getSourceData();
    if (dataObject.isDataReadyToDisplay) {
      return dataObject.isDataReadyToDisplay();
    }
    return true;
  }
  reprocessTransformations() {
    this.transform(this.getSourceData().state.data, true);
  }
  cancelQuery() {
    var _a, _b;
    (_b = (_a = this.getSourceData()).cancelQuery) == null ? void 0 : _b.call(_a);
  }
  getResultsStream() {
    return this._results;
  }
  clone(withState) {
    const clone = super.clone(withState);
    if (this._prevDataFromSource) {
      clone["_prevDataFromSource"] = this._prevDataFromSource;
    }
    return clone;
  }
  haveAlreadyTransformedData(data) {
    if (!this._prevDataFromSource) {
      return false;
    }
    if (data === this._prevDataFromSource) {
      return true;
    }
    const { series, annotations } = this._prevDataFromSource;
    if (data.series === series && data.annotations === annotations) {
      if (this.state.data && data.state !== this.state.data.state) {
        this.setState({ data: __spreadProps$9(__spreadValues$i({}, this.state.data), { state: data.state }) });
      }
      return true;
    }
    return false;
  }
  transform(data$1, force = false) {
    var _a;
    if (this.state.transformations.length === 0 || !data$1) {
      this._prevDataFromSource = data$1;
      this.setState({ data: data$1 });
      if (data$1) {
        this._results.next({ origin: this, data: data$1 });
      }
      return;
    }
    if (!force && this.haveAlreadyTransformedData(data$1)) {
      return;
    }
    const seriesTransformations = this.state.transformations.filter((transformation) => {
      if ("options" in transformation || "topic" in transformation) {
        return transformation.topic == null || transformation.topic === data.DataTopic.Series;
      }
      return true;
    }).map((transformation) => "operator" in transformation ? transformation.operator : transformation);
    const annotationsTransformations = this.state.transformations.filter((transformation) => {
      if ("options" in transformation || "topic" in transformation) {
        return transformation.topic === data.DataTopic.Annotations;
      }
      return false;
    }).map((transformation) => "operator" in transformation ? transformation.operator : transformation);
    if (this._transformSub) {
      this._transformSub.unsubscribe();
    }
    const ctx = {
      interpolate: (value) => {
        var _a2;
        return sceneGraph.interpolate(this, value, (_a2 = data$1.request) == null ? void 0 : _a2.scopedVars);
      }
    };
    let streams = [data.transformDataFrame(seriesTransformations, data$1.series, ctx)];
    if (data$1.annotations && data$1.annotations.length > 0 && annotationsTransformations.length > 0) {
      streams.push(data.transformDataFrame(annotationsTransformations, (_a = data$1.annotations) != null ? _a : []));
    }
    this._transformSub = rxjs.forkJoin(streams).pipe(
      rxjs.map((values) => {
        const transformedSeries = values[0];
        const transformedAnnotations = values[1];
        return __spreadProps$9(__spreadValues$i({}, data$1), {
          series: transformedSeries,
          annotations: transformedAnnotations != null ? transformedAnnotations : data$1.annotations
        });
      }),
      rxjs.catchError((err) => {
        var _a2;
        console.error("Error transforming data: ", err);
        const sourceErr = ((_a2 = this.getSourceData().state.data) == null ? void 0 : _a2.errors) || [];
        const transformationError = runtime.toDataQueryError(err);
        transformationError.message = `Error transforming data: ${transformationError.message}`;
        const result = __spreadProps$9(__spreadValues$i({}, data$1), {
          state: data.LoadingState.Error,
          errors: [...sourceErr, transformationError]
        });
        return rxjs.of(result);
      })
    ).subscribe((transformedData) => {
      this.setState({ data: transformedData });
      this._results.next({ origin: this, data: transformedData });
      this._prevDataFromSource = data$1;
    });
  }
}

class VariableValueSelectors extends SceneObjectBase {
}
VariableValueSelectors.Component = VariableValueSelectorsRenderer;
function VariableValueSelectorsRenderer({ model }) {
  const variables = sceneGraph.getVariables(model).useState();
  return /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, variables.variables.map((variable) => /* @__PURE__ */ React__default["default"].createElement(VariableValueSelectWrapper, {
    key: variable.state.key,
    variable,
    layout: model.state.layout
  })));
}
function VariableValueSelectWrapper({ variable, layout, showAlways, hideLabel }) {
  const state = useSceneObjectState(variable, { shouldActivateOrKeepAlive: true });
  if (state.hide === data.VariableHide.hideVariable && !showAlways) {
    return null;
  }
  if (layout === "vertical") {
    return /* @__PURE__ */ React__default["default"].createElement("div", {
      className: verticalContainer,
      "data-testid": e2eSelectors.selectors.pages.Dashboard.SubMenu.submenuItem
    }, /* @__PURE__ */ React__default["default"].createElement(VariableLabel, {
      variable,
      layout,
      hideLabel
    }), /* @__PURE__ */ React__default["default"].createElement(variable.Component, {
      model: variable
    }));
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: containerStyle,
    "data-testid": e2eSelectors.selectors.pages.Dashboard.SubMenu.submenuItem
  }, /* @__PURE__ */ React__default["default"].createElement(VariableLabel, {
    variable,
    hideLabel
  }), /* @__PURE__ */ React__default["default"].createElement(variable.Component, {
    model: variable
  }));
}
function VariableLabel({ variable, layout, hideLabel }) {
  var _a;
  const { state } = variable;
  if (variable.state.hide === data.VariableHide.hideLabel || hideLabel) {
    return null;
  }
  const elementId = `var-${state.key}`;
  const labelOrName = state.label || state.name;
  return /* @__PURE__ */ React__default["default"].createElement(ControlsLabel, {
    htmlFor: elementId,
    isLoading: state.loading,
    onCancel: () => {
      var _a2;
      return (_a2 = variable.onCancel) == null ? void 0 : _a2.call(variable);
    },
    label: labelOrName,
    error: state.error,
    layout,
    description: (_a = state.description) != null ? _a : void 0
  });
}
const containerStyle = css.css({ display: "flex" });
const verticalContainer = css.css({ display: "flex", flexDirection: "column" });

class VariableValueControl extends SceneObjectBase {
}
VariableValueControl.Component = VariableValueControlRenderer;
function VariableValueControlRenderer({ model }) {
  const variable = sceneGraph.lookupVariable(model.state.variableName, model);
  if (!variable) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement(VariableValueSelectWrapper, {
    key: variable.state.key,
    variable,
    layout: model.state.layout,
    showAlways: true
  });
}

class SceneVariableSet extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._variablesThatHaveChanged = /* @__PURE__ */ new Set();
    this._variablesToUpdate = /* @__PURE__ */ new Set();
    this._updating = /* @__PURE__ */ new Map();
    this._variableValueRecorder = new VariableValueRecorder();
    this._variableDependency = new SceneVariableSetVariableDependencyHandler(
      this._handleParentVariableUpdatesCompleted.bind(this)
    );
    this._onActivate = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      this._subs.add(
        this.subscribeToEvent(SceneVariableValueChangedEvent, (event) => this._handleVariableValueChanged(event.payload))
      );
      this._subs.add(
        timeRange.subscribeToState(() => {
          this._refreshTimeRangeBasedVariables();
        })
      );
      this._subs.add(this.subscribeToState(this._onStateChanged));
      this._checkForVariablesThatChangedWhileInactive();
      for (const variable of this.state.variables) {
        if (this._variableNeedsUpdate(variable)) {
          this._variablesToUpdate.add(variable);
        }
      }
      this._updateNextBatch();
      return this._onDeactivate;
    };
    this._onDeactivate = () => {
      var _a;
      for (const update of this._updating.values()) {
        (_a = update.subscription) == null ? void 0 : _a.unsubscribe();
      }
      for (const variable of this.state.variables) {
        if (!this._variablesToUpdate.has(variable) && !this._updating.has(variable)) {
          this._variableValueRecorder.recordCurrentValue(variable);
        }
      }
      this._variablesToUpdate.clear();
      this._updating.clear();
    };
    this._onStateChanged = (newState, oldState) => {
      const variablesToUpdateCountStart = this._variablesToUpdate.size;
      for (const variable of oldState.variables) {
        if (!newState.variables.includes(variable)) {
          const updating = this._updating.get(variable);
          if (updating == null ? void 0 : updating.subscription) {
            updating.subscription.unsubscribe();
          }
          this._updating.delete(variable);
          this._variablesToUpdate.delete(variable);
        }
      }
      for (const variable of newState.variables) {
        if (!oldState.variables.includes(variable)) {
          if (this._variableNeedsUpdate(variable)) {
            this._variablesToUpdate.add(variable);
          }
        }
      }
      if (variablesToUpdateCountStart === 0 && this._variablesToUpdate.size > 0) {
        this._updateNextBatch();
      }
    };
    this.addActivationHandler(this._onActivate);
  }
  getByName(name) {
    return this.state.variables.find((x) => x.state.name === name);
  }
  _refreshTimeRangeBasedVariables() {
    for (const variable of this.state.variables) {
      if ("refresh" in variable.state && variable.state.refresh === data.VariableRefresh.onTimeRangeChanged) {
        this._variablesToUpdate.add(variable);
      }
    }
    this._updateNextBatch();
  }
  _checkForVariablesThatChangedWhileInactive() {
    if (!this._variableValueRecorder.hasValues()) {
      return;
    }
    for (const variable of this.state.variables) {
      if (this._variableValueRecorder.hasValueChanged(variable)) {
        writeVariableTraceLog(variable, "Changed while in-active");
        this._addDependentVariablesToUpdateQueue(variable);
      }
    }
  }
  _variableNeedsUpdate(variable) {
    if (variable.isLazy) {
      return false;
    }
    if (!variable.validateAndUpdate) {
      return false;
    }
    if (this._variableValueRecorder.hasRecordedValue(variable)) {
      writeVariableTraceLog(variable, "Skipping updateAndValidate current value valid");
      return false;
    }
    return true;
  }
  _updateNextBatch() {
    for (const variable of this._variablesToUpdate) {
      if (!variable.validateAndUpdate) {
        throw new Error("Variable added to variablesToUpdate but does not have validateAndUpdate");
      }
      if (this._updating.has(variable)) {
        continue;
      }
      if (sceneGraph.hasVariableDependencyInLoadingState(variable)) {
        continue;
      }
      const variableToUpdate = {
        variable
      };
      this._updating.set(variable, variableToUpdate);
      writeVariableTraceLog(variable, "updateAndValidate started");
      variableToUpdate.subscription = variable.validateAndUpdate().subscribe({
        next: () => this._validateAndUpdateCompleted(variable),
        complete: () => this._validateAndUpdateCompleted(variable),
        error: (err) => this._handleVariableError(variable, err)
      });
    }
  }
  _validateAndUpdateCompleted(variable) {
    var _a;
    if (!this._updating.has(variable)) {
      return;
    }
    const update = this._updating.get(variable);
    (_a = update == null ? void 0 : update.subscription) == null ? void 0 : _a.unsubscribe();
    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
    writeVariableTraceLog(variable, "updateAndValidate completed");
    this._notifyDependentSceneObjects(variable);
    this._updateNextBatch();
  }
  cancel(variable) {
    var _a;
    const update = this._updating.get(variable);
    (_a = update == null ? void 0 : update.subscription) == null ? void 0 : _a.unsubscribe();
    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
  }
  _handleVariableError(variable, err) {
    var _a;
    const update = this._updating.get(variable);
    (_a = update == null ? void 0 : update.subscription) == null ? void 0 : _a.unsubscribe();
    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
    variable.setState({ loading: false, error: err.message });
    console.error("SceneVariableSet updateAndValidate error", err);
    writeVariableTraceLog(variable, "updateAndValidate error", err);
    this._notifyDependentSceneObjects(variable);
    this._updateNextBatch();
  }
  _handleVariableValueChanged(variableThatChanged) {
    this._variablesThatHaveChanged.add(variableThatChanged);
    this._addDependentVariablesToUpdateQueue(variableThatChanged);
    if (!this._updating.has(variableThatChanged)) {
      this._updateNextBatch();
      this._notifyDependentSceneObjects(variableThatChanged);
    }
  }
  _handleParentVariableUpdatesCompleted(variable, hasChanged) {
    if (hasChanged) {
      this._addDependentVariablesToUpdateQueue(variable);
    }
    if (this._variablesToUpdate.size > 0 && this._updating.size === 0) {
      this._updateNextBatch();
    }
  }
  _addDependentVariablesToUpdateQueue(variableThatChanged) {
    for (const otherVariable of this.state.variables) {
      if (otherVariable.variableDependency) {
        if (otherVariable.variableDependency.hasDependencyOn(variableThatChanged.state.name)) {
          writeVariableTraceLog(otherVariable, "Added to update queue, dependant variable value changed");
          if (this._updating.has(otherVariable) && otherVariable.onCancel) {
            otherVariable.onCancel();
          }
          this._variablesToUpdate.add(otherVariable);
        }
      }
    }
  }
  _notifyDependentSceneObjects(variable) {
    if (!this.parent) {
      return;
    }
    this._traverseSceneAndNotify(this.parent, variable, this._variablesThatHaveChanged.has(variable));
    this._variablesThatHaveChanged.delete(variable);
  }
  _traverseSceneAndNotify(sceneObject, variable, hasChanged) {
    if (this === sceneObject) {
      return;
    }
    if (!sceneObject.isActive) {
      return;
    }
    if (sceneObject.state.$variables && sceneObject.state.$variables !== this) {
      const localVar = sceneObject.state.$variables.getByName(variable.state.name);
      if (localVar) {
        return;
      }
    }
    if (sceneObject.variableDependency) {
      sceneObject.variableDependency.variableUpdateCompleted(variable, hasChanged);
    }
    sceneObject.forEachChild((child) => this._traverseSceneAndNotify(child, variable, hasChanged));
  }
  isVariableLoadingOrWaitingToUpdate(variable) {
    if (variable.isAncestorLoading && variable.isAncestorLoading()) {
      return true;
    }
    if (this._variablesToUpdate.has(variable) || this._updating.has(variable)) {
      return true;
    }
    return sceneGraph.hasVariableDependencyInLoadingState(variable);
  }
}
function writeVariableTraceLog(variable, message, err) {
  if (err) {
    writeSceneLog("SceneVariableSet", `Variable[${variable.state.name}]: ${message}`, err);
  } else {
    writeSceneLog("SceneVariableSet", `Variable[${variable.state.name}]: ${message}`);
  }
}
class SceneVariableSetVariableDependencyHandler {
  constructor(_variableUpdatesCompleted) {
    this._variableUpdatesCompleted = _variableUpdatesCompleted;
    this._emptySet = /* @__PURE__ */ new Set();
  }
  getNames() {
    return this._emptySet;
  }
  hasDependencyOn(name) {
    return false;
  }
  variableUpdateCompleted(variable, hasChanged) {
    this._variableUpdatesCompleted(variable, hasChanged);
  }
}

var __defProp$h = Object.defineProperty;
var __getOwnPropSymbols$h = Object.getOwnPropertySymbols;
var __hasOwnProp$h = Object.prototype.hasOwnProperty;
var __propIsEnum$h = Object.prototype.propertyIsEnumerable;
var __defNormalProp$h = (obj, key, value) => key in obj ? __defProp$h(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$h = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$h.call(b, prop))
      __defNormalProp$h(a, prop, b[prop]);
  if (__getOwnPropSymbols$h)
    for (var prop of __getOwnPropSymbols$h(b)) {
      if (__propIsEnum$h.call(b, prop))
        __defNormalProp$h(a, prop, b[prop]);
    }
  return a;
};
class CustomVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadValues$h({
      type: "custom",
      query: "",
      value: "",
      text: "",
      options: [],
      name: ""
    }, initialState));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["query"]
    });
  }
  getValueOptions(args) {
    var _a;
    const interpolated = sceneGraph.interpolate(this, this.state.query);
    const match = (_a = interpolated.match(/(?:\\,|[^,])+/g)) != null ? _a : [];
    const options = match.map((text) => {
      var _a2;
      text = text.replace(/\\,/g, ",");
      const textMatch = (_a2 = /^(.+)\s:\s(.+)$/g.exec(text)) != null ? _a2 : [];
      if (textMatch.length === 3) {
        const [, key, value] = textMatch;
        return { label: key.trim(), value: value.trim() };
      } else {
        return { label: text.trim(), value: text.trim() };
      }
    });
    return rxjs.of(options);
  }
}
CustomVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};

var __defProp$g = Object.defineProperty;
var __getOwnPropSymbols$g = Object.getOwnPropertySymbols;
var __hasOwnProp$g = Object.prototype.hasOwnProperty;
var __propIsEnum$g = Object.prototype.propertyIsEnumerable;
var __defNormalProp$g = (obj, key, value) => key in obj ? __defProp$g(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$g = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$g.call(b, prop))
      __defNormalProp$g(a, prop, b[prop]);
  if (__getOwnPropSymbols$g)
    for (var prop of __getOwnPropSymbols$g(b)) {
      if (__propIsEnum$g.call(b, prop))
        __defNormalProp$g(a, prop, b[prop]);
    }
  return a;
};
class DataSourceVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadValues$g({
      type: "datasource",
      value: "",
      text: "",
      options: [],
      name: "",
      regex: "",
      pluginId: ""
    }, initialState));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["regex"]
    });
  }
  getValueOptions(args) {
    if (!this.state.pluginId) {
      return rxjs.of([]);
    }
    const dataSources = runtime.getDataSourceSrv().getList({ metrics: true, variables: false, pluginId: this.state.pluginId });
    let regex;
    if (this.state.regex) {
      const interpolated = sceneGraph.interpolate(this, this.state.regex, void 0, "regex");
      regex = data.stringToJsRegex(interpolated);
    }
    const options = [];
    for (let i = 0; i < dataSources.length; i++) {
      const source = dataSources[i];
      if (isValid(source, regex)) {
        options.push({ label: source.name, value: source.uid });
      }
      if (this.state.defaultOptionEnabled && isDefault(source, regex)) {
        options.push({ label: "default", value: "default" });
      }
    }
    if (options.length === 0) {
      this.setState({ error: "No data sources found" });
    } else if (this.state.error) {
      this.setState({ error: null });
    }
    return rxjs.of(options);
  }
}
DataSourceVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};
function isValid(source, regex) {
  if (!regex) {
    return true;
  }
  return regex.exec(source.name);
}
function isDefault(source, regex) {
  if (!source.isDefault) {
    return false;
  }
  if (!regex) {
    return true;
  }
  return regex.exec("default");
}

function buildMetricTree(parent, depth) {
  const chars = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const children = [];
  if (depth > 5) {
    return [];
  }
  for (const letter of chars) {
    const nodeName = `${parent}${letter}`;
    children.push({
      name: nodeName,
      children: buildMetricTree(nodeName, depth + 1)
    });
  }
  return children;
}
function queryTree(children, query, queryIndex) {
  if (queryIndex >= query.length) {
    return children;
  }
  if (query[queryIndex] === "*") {
    return children;
  }
  const nodeQuery = query[queryIndex];
  let result = [];
  let namesToMatch = [nodeQuery];
  if (nodeQuery.startsWith("{")) {
    namesToMatch = nodeQuery.replace(/\{|\}/g, "").split(",");
  }
  for (const node of children) {
    for (const nameToMatch of namesToMatch) {
      if (nameToMatch.indexOf("*") !== -1) {
        const pattern = nameToMatch.replace("*", "");
        const regex = new RegExp(`^${pattern}.*`, "gi");
        if (regex.test(node.name)) {
          result = result.concat(queryTree([node], query, queryIndex + 1));
        }
      } else if (node.name === nameToMatch) {
        result = result.concat(queryTree(node.children, query, queryIndex + 1));
      }
    }
  }
  return result;
}
function queryMetricTree(query) {
  if (query.indexOf("value") === 0) {
    return [{ name: query, children: [] }];
  }
  const children = buildMetricTree("", 0);
  return queryTree(children, query.split("."), 0);
}

var __defProp$f = Object.defineProperty;
var __getOwnPropSymbols$f = Object.getOwnPropertySymbols;
var __hasOwnProp$f = Object.prototype.hasOwnProperty;
var __propIsEnum$f = Object.prototype.propertyIsEnumerable;
var __defNormalProp$f = (obj, key, value) => key in obj ? __defProp$f(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$f = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$f.call(b, prop))
      __defNormalProp$f(a, prop, b[prop]);
  if (__getOwnPropSymbols$f)
    for (var prop of __getOwnPropSymbols$f(b)) {
      if (__propIsEnum$f.call(b, prop))
        __defNormalProp$f(a, prop, b[prop]);
    }
  return a;
};
class TestVariable extends MultiValueVariable {
  constructor(initialState, isLazy = false) {
    super(__spreadValues$f({
      type: "custom",
      name: "Test",
      value: "Value",
      text: "Text",
      query: "Query",
      options: [],
      refresh: data.VariableRefresh.onDashboardLoad,
      updateOptions: true
    }, initialState));
    this.completeUpdate = new rxjs.Subject();
    this.isGettingValues = true;
    this.getValueOptionsCount = 0;
    this.isLazy = false;
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["query"]
    });
    this.isLazy = isLazy;
  }
  getValueOptions(args) {
    const { delayMs } = this.state;
    this.getValueOptionsCount += 1;
    const queryController = sceneGraph.getQueryController(this);
    return new rxjs.Observable((observer) => {
      const queryEntry = {
        type: "variable",
        origin: this,
        cancel: () => observer.complete()
      };
      if (queryController) {
        queryController.queryStarted(queryEntry);
      }
      this.setState({ loading: true });
      if (this.state.throwError) {
        throw new Error(this.state.throwError);
      }
      const interpolatedQuery = sceneGraph.interpolate(this, this.state.query);
      const options = this.getOptions(interpolatedQuery);
      const sub = this.completeUpdate.subscribe({
        next: () => {
          const newState = { issuedQuery: interpolatedQuery, loading: false };
          if (this.state.updateOptions) {
            newState.options = options;
          }
          this.setState(newState);
          observer.next(options);
          observer.complete();
        }
      });
      let timeout;
      if (delayMs) {
        timeout = window.setTimeout(() => this.signalUpdateCompleted(), delayMs);
      } else if (delayMs === 0) {
        this.signalUpdateCompleted();
      }
      this.isGettingValues = true;
      return () => {
        sub.unsubscribe();
        window.clearTimeout(timeout);
        this.isGettingValues = false;
        if (this.state.loading) {
          this.setState({ loading: false });
        }
        if (queryController) {
          queryController.queryCompleted(queryEntry);
        }
      };
    });
  }
  cancel() {
    const sceneVarSet = getClosest(this, (s) => s instanceof SceneVariableSet ? s : void 0);
    sceneVarSet == null ? void 0 : sceneVarSet.cancel(this);
  }
  getOptions(interpolatedQuery) {
    if (this.state.optionsToReturn) {
      return this.state.optionsToReturn;
    }
    return queryMetricTree(interpolatedQuery).map((x) => ({ label: x.name, value: x.name }));
  }
  signalUpdateCompleted() {
    this.completeUpdate.next(1);
  }
}
TestVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};

function VariableValueInput({ model }) {
  const { value, key, loading } = model.useState();
  const onBlur = React.useCallback(
    (e) => {
      model.setValue(e.currentTarget.value);
    },
    [model]
  );
  const onKeyDown = React.useCallback(
    (e) => {
      if (e.key === "Enter") {
        model.setValue(e.currentTarget.value);
      }
    },
    [model]
  );
  return /* @__PURE__ */ React__default["default"].createElement(ui.AutoSizeInput, {
    id: key,
    placeholder: "Enter value",
    minWidth: 15,
    maxWidth: 30,
    value,
    loading,
    onBlur,
    onKeyDown
  });
}

var __defProp$e = Object.defineProperty;
var __getOwnPropSymbols$e = Object.getOwnPropertySymbols;
var __hasOwnProp$e = Object.prototype.hasOwnProperty;
var __propIsEnum$e = Object.prototype.propertyIsEnumerable;
var __defNormalProp$e = (obj, key, value) => key in obj ? __defProp$e(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$e = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$e.call(b, prop))
      __defNormalProp$e(a, prop, b[prop]);
  if (__getOwnPropSymbols$e)
    for (var prop of __getOwnPropSymbols$e(b)) {
      if (__propIsEnum$e.call(b, prop))
        __defNormalProp$e(a, prop, b[prop]);
    }
  return a;
};
class TextBoxVariable extends SceneObjectBase {
  constructor(initialState) {
    super(__spreadValues$e({
      type: "textbox",
      value: "",
      name: ""
    }, initialState));
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => [this.getKey()] });
  }
  getValue() {
    return this.state.value;
  }
  setValue(newValue) {
    if (newValue !== this.state.value) {
      this.setState({ value: newValue });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
  getKey() {
    return `var-${this.state.name}`;
  }
  getUrlState() {
    return { [this.getKey()]: this.state.value };
  }
  updateFromUrl(values) {
    const val = values[this.getKey()];
    if (typeof val === "string") {
      this.setValue(val);
    }
  }
}
TextBoxVariable.Component = ({ model }) => {
  return /* @__PURE__ */ React__default["default"].createElement(VariableValueInput, {
    model
  });
};

var __defProp$d = Object.defineProperty;
var __defProps$8 = Object.defineProperties;
var __getOwnPropDescs$8 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$d = Object.getOwnPropertySymbols;
var __hasOwnProp$d = Object.prototype.hasOwnProperty;
var __propIsEnum$d = Object.prototype.propertyIsEnumerable;
var __defNormalProp$d = (obj, key, value) => key in obj ? __defProp$d(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$d = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$d.call(b, prop))
      __defNormalProp$d(a, prop, b[prop]);
  if (__getOwnPropSymbols$d)
    for (var prop of __getOwnPropSymbols$d(b)) {
      if (__propIsEnum$d.call(b, prop))
        __defNormalProp$d(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$8 = (a, b) => __defProps$8(a, __getOwnPropDescs$8(b));
class LocalValueVariable extends SceneObjectBase {
  constructor(initialState) {
    super(__spreadProps$8(__spreadValues$d({
      type: "system",
      value: "",
      text: "",
      name: ""
    }, initialState), {
      skipUrlSync: true
    }));
  }
  getValue() {
    return this.state.value;
  }
  getValueText() {
    return this.state.text.toString();
  }
  isAncestorLoading() {
    var _a, _b;
    const ancestorScope = (_b = (_a = this.parent) == null ? void 0 : _a.parent) == null ? void 0 : _b.parent;
    if (!ancestorScope) {
      throw new Error("LocalValueVariable requires a parent SceneVariableSet that has an ancestor SceneVariableSet");
    }
    const set = sceneGraph.getVariables(ancestorScope);
    const parentVar = sceneGraph.lookupVariable(this.state.name, ancestorScope);
    if (set && parentVar) {
      return set.isVariableLoadingOrWaitingToUpdate(parentVar);
    }
    return false;
  }
}

var __defProp$c = Object.defineProperty;
var __getOwnPropSymbols$c = Object.getOwnPropertySymbols;
var __hasOwnProp$c = Object.prototype.hasOwnProperty;
var __propIsEnum$c = Object.prototype.propertyIsEnumerable;
var __defNormalProp$c = (obj, key, value) => key in obj ? __defProp$c(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$c = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$c.call(b, prop))
      __defNormalProp$c(a, prop, b[prop]);
  if (__getOwnPropSymbols$c)
    for (var prop of __getOwnPropSymbols$c(b)) {
      if (__propIsEnum$c.call(b, prop))
        __defNormalProp$c(a, prop, b[prop]);
    }
  return a;
};
class IntervalVariable extends SceneObjectBase {
  constructor(initialState) {
    super(__spreadValues$c({
      type: "interval",
      value: "",
      intervals: ["1m", "10m", "30m", "1h", "6h", "12h", "1d", "7d", "14d", "30d"],
      name: "",
      autoStepCount: 30,
      autoMinInterval: "10s",
      autoEnabled: false,
      refresh: schema.VariableRefresh.onTimeRangeChanged
    }, initialState));
    this._onChange = (value) => {
      this.setState({ value: value.value });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    };
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => [this.getKey()] });
  }
  getKey() {
    return `var-${this.state.name}`;
  }
  getUrlState() {
    return { [this.getKey()]: this.state.value };
  }
  updateFromUrl(values) {
    const update = {};
    const val = values[this.getKey()];
    if (typeof val === "string") {
      if (val.startsWith("$__auto_interval_")) {
        update.value = AUTO_VARIABLE_VALUE;
      } else {
        update.value = val;
      }
    }
    this.setState(update);
  }
  getOptionsForSelect() {
    const { value: currentValue, intervals, autoEnabled } = this.state;
    let options = intervals.map((interval) => ({ value: interval, label: interval }));
    if (autoEnabled) {
      options = [{ value: AUTO_VARIABLE_VALUE, label: AUTO_VARIABLE_TEXT }, ...options];
    }
    if (currentValue && !options.some((option) => option.value === currentValue)) {
      options.push({ value: currentValue, label: currentValue });
    }
    return options;
  }
  getValue() {
    const { value, autoStepCount, autoMinInterval } = this.state;
    if (value === AUTO_VARIABLE_VALUE) {
      return this.getAutoRefreshInteval(autoStepCount, autoMinInterval);
    }
    return value;
  }
  getAutoRefreshInteval(autoStepCount, minRefreshInterval) {
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const intervalObject = data.rangeUtil.calculateInterval(timeRange, autoStepCount, minRefreshInterval);
    return intervalObject.interval;
  }
  validateAndUpdate() {
    const { value, intervals } = this.state;
    let shouldPublish = false;
    if (value === AUTO_VARIABLE_VALUE) {
      shouldPublish = true;
    } else if (!value && intervals.length > 0) {
      const firstOption = intervals[0];
      this.setState({ value: firstOption });
      shouldPublish = true;
    }
    if (shouldPublish) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
    return rxjs.of({});
  }
}
IntervalVariable.Component = ({ model }) => {
  const { key, value } = model.useState();
  return /* @__PURE__ */ React__default["default"].createElement(ui.Select, {
    id: key,
    placeholder: "Select value",
    width: "auto",
    value,
    tabSelectsValue: false,
    options: model.getOptionsForSelect(),
    onChange: model._onChange
  });
};

var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _cache, _location;
class NewSceneObjectAddedEvent extends data.BusEventWithPayload {
}
NewSceneObjectAddedEvent.type = "new-scene-object-added";
class UrlSyncManager {
  constructor(_options = {}, locationService = runtime.locationService) {
    this._urlKeyMapper = new UniqueUrlKeyMapper();
    this._options = _options;
    this._locationService = locationService;
    this._paramsCache = new UrlParamsCache(locationService);
  }
  initSync(root) {
    var _a;
    if (this._subs) {
      writeSceneLog("UrlSyncManager", "Unregister previous scene state subscription", (_a = this._sceneRoot) == null ? void 0 : _a.state.key);
      this._subs.unsubscribe();
    }
    writeSceneLog("UrlSyncManager", "init", root.state.key);
    this._sceneRoot = root;
    this._subs = new rxjs.Subscription();
    this._subs.add(
      root.subscribeToEvent(SceneObjectStateChangedEvent, (evt) => {
        this.handleSceneObjectStateChanged(evt.payload.changedObject);
      })
    );
    this._subs.add(
      root.subscribeToEvent(NewSceneObjectAddedEvent, (evt) => {
        this.handleNewObject(evt.payload);
      })
    );
    this._urlKeyMapper.clear();
    this._lastLocation = this._locationService.getLocation();
    this.handleNewObject(this._sceneRoot);
    if (this._options.updateUrlOnInit) {
      const urlState = getUrlState(root);
      if (isUrlStateDifferent(urlState, this._paramsCache.getParams())) {
        this._locationService.partial(urlState, true);
      }
    }
  }
  cleanUp(root) {
    if (this._sceneRoot !== root) {
      return;
    }
    writeSceneLog("UrlSyncManager", "Clean up");
    if (this._subs) {
      this._subs.unsubscribe();
      this._subs = void 0;
      writeSceneLog(
        "UrlSyncManager",
        "Root deactived, unsub to state",
        "same key",
        this._sceneRoot.state.key === root.state.key
      );
    }
    this._sceneRoot = void 0;
    this._lastLocation = void 0;
  }
  handleNewLocation(location) {
    if (!this._sceneRoot || this._lastLocation === location) {
      return;
    }
    writeSceneLog("UrlSyncManager", "handleNewLocation");
    this._lastLocation = location;
    syncStateFromUrl(this._sceneRoot, this._paramsCache.getParams(), this._urlKeyMapper);
  }
  handleNewObject(sceneObj) {
    if (!this._sceneRoot) {
      return;
    }
    syncStateFromUrl(sceneObj, this._paramsCache.getParams(), this._urlKeyMapper);
  }
  handleSceneObjectStateChanged(changedObject) {
    var _a, _b;
    if (!changedObject.urlSync) {
      return;
    }
    const newUrlState = changedObject.urlSync.getUrlState();
    const searchParams = this._locationService.getSearch();
    const mappedUpdated = {};
    for (const [key, newUrlValue] of Object.entries(newUrlState)) {
      const uniqueKey = this._urlKeyMapper.getUniqueKey(key, changedObject);
      const currentUrlValue = searchParams.getAll(uniqueKey);
      if (!isUrlValueEqual(currentUrlValue, newUrlValue)) {
        mappedUpdated[uniqueKey] = newUrlValue;
      }
    }
    if (Object.keys(mappedUpdated).length > 0) {
      const shouldCreateHistoryEntry = (_b = (_a = changedObject.urlSync).shouldCreateHistoryStep) == null ? void 0 : _b.call(_a, newUrlState);
      const shouldReplace = shouldCreateHistoryEntry !== true;
      writeSceneLog("UrlSyncManager", "onStateChange updating URL");
      this._locationService.partial(mappedUpdated, shouldReplace);
      this._lastLocation = this._locationService.getLocation();
    }
  }
  getUrlState(root) {
    return getUrlState(root);
  }
}
class UrlParamsCache {
  constructor(locationService) {
    this.locationService = locationService;
    __privateAdd(this, _cache, void 0);
    __privateAdd(this, _location, void 0);
  }
  getParams() {
    const location = this.locationService.getLocation();
    if (__privateGet(this, _location) === location) {
      return __privateGet(this, _cache);
    }
    __privateSet(this, _location, location);
    __privateSet(this, _cache, new URLSearchParams(location.search));
    return __privateGet(this, _cache);
  }
}
_cache = new WeakMap();
_location = new WeakMap();
function isUrlStateDifferent(sceneUrlState, currentParams) {
  for (let key in sceneUrlState) {
    if (!isUrlValueEqual(currentParams.getAll(key), sceneUrlState[key])) {
      return true;
    }
  }
  return false;
}
function useUrlSyncManager(options, locationService) {
  return React.useMemo(
    () => new UrlSyncManager(
      {
        updateUrlOnInit: options.updateUrlOnInit,
        createBrowserHistorySteps: options.createBrowserHistorySteps
      },
      locationService
    ),
    [options.updateUrlOnInit, options.createBrowserHistorySteps, locationService]
  );
}

function useUrlSync(sceneRoot, options = {}) {
  const location = reactRouterDom.useLocation();
  const locationService = useLocationServiceSafe();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const urlSyncManager = useUrlSyncManager(options, locationService);
  React.useEffect(() => {
    urlSyncManager.initSync(sceneRoot);
    setIsInitialized(true);
    return () => urlSyncManager.cleanUp(sceneRoot);
  }, [sceneRoot, urlSyncManager]);
  React.useEffect(() => {
    const latestLocation = locationService.getLocation();
    const locationToHandle = latestLocation !== location ? latestLocation : location;
    if (latestLocation !== location) {
      writeSceneLog("useUrlSync", "latestLocation different from location");
    }
    urlSyncManager.handleNewLocation(locationToHandle);
  }, [sceneRoot, urlSyncManager, location, locationService]);
  return isInitialized;
}

function UrlSyncContextProvider({
  children,
  scene,
  updateUrlOnInit,
  createBrowserHistorySteps
}) {
  const isInitialized = useUrlSync(scene, { updateUrlOnInit, createBrowserHistorySteps });
  if (!isInitialized) {
    return null;
  }
  return children;
}

function setWindowGrafanaSceneContext(activeScene) {
  const prevScene = window.__grafanaSceneContext;
  writeSceneLog("setWindowGrafanaScene", "set window.__grafanaSceneContext", activeScene);
  window.__grafanaSceneContext = activeScene;
  return () => {
    if (window.__grafanaSceneContext === activeScene) {
      writeSceneLog("setWindowGrafanaScene", "restore window.__grafanaSceneContext", prevScene);
      window.__grafanaSceneContext = prevScene;
    }
  };
}

class EmbeddedScene extends SceneObjectBase {
  constructor(state) {
    super(state);
    this.addActivationHandler(() => {
      const unsetGlobalScene = setWindowGrafanaSceneContext(this);
      return () => {
        unsetGlobalScene();
      };
    });
  }
}
EmbeddedScene.Component = EmbeddedSceneRenderer;
function EmbeddedSceneRenderer({ model }) {
  const { body, controls } = model.useState();
  const styles = ui.useStyles2(getStyles$7);
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.container
  }, controls && /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.controls
  }, controls.map((control) => /* @__PURE__ */ React__default["default"].createElement(control.Component, {
    key: control.state.key,
    model: control
  }))), /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.body
  }, /* @__PURE__ */ React__default["default"].createElement(body.Component, {
    model: body
  })));
}
const getStyles$7 = (theme) => {
  return {
    container: css.css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(2),
      minHeight: "100%",
      flexDirection: "column"
    }),
    body: css.css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(1)
    }),
    controls: css.css({
      display: "flex",
      gap: theme.spacing(2),
      alignItems: "flex-end",
      flexWrap: "wrap"
    })
  };
};

class VizPanelMenu extends SceneObjectBase {
  addItem(item) {
    this.setState({
      items: this.state.items ? [...this.state.items, item] : [item]
    });
  }
  setItems(items) {
    this.setState({
      items
    });
  }
}
VizPanelMenu.Component = VizPanelMenuRenderer;
function VizPanelMenuRenderer({ model }) {
  const { items = [] } = model.useState();
  const ref = React__default["default"].useRef(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);
  const renderItems = (items2) => {
    return items2.map((item) => {
      switch (item.type) {
        case "divider":
          return /* @__PURE__ */ React__default["default"].createElement(ui.Menu.Divider, {
            key: item.text
          });
        case "group":
          return /* @__PURE__ */ React__default["default"].createElement(ui.Menu.Group, {
            key: item.text,
            label: item.text
          }, item.subMenu ? renderItems(item.subMenu) : void 0);
        default:
          return /* @__PURE__ */ React__default["default"].createElement(ui.Menu.Item, {
            key: item.text,
            label: item.text,
            icon: item.iconClassName,
            childItems: item.subMenu ? renderItems(item.subMenu) : void 0,
            url: item.href,
            onClick: item.onClick,
            shortcut: item.shortcut,
            testId: e2eSelectors.selectors.components.Panels.Panel.menuItems(item.text)
          });
      }
    });
  };
  return /* @__PURE__ */ React__default["default"].createElement(ui.Menu, {
    ref
  }, renderItems(items));
}

async function getExploreURL(data, model, timeRange, transform) {
  var _a, _b, _c, _d;
  const targets = (_a = data.request) == null ? void 0 : _a.targets;
  if (!targets) {
    return "";
  }
  const { from, to } = timeRange;
  const filters = (_b = data.request) == null ? void 0 : _b.filters;
  const scopedVars = {
    __sceneObject: wrapInSafeSerializableSceneObject(model)
  };
  const interpolatedQueries = (await Promise.allSettled(
    targets.map(async (q) => {
      var _a2;
      const queryDs = await runtime.getDataSourceSrv().get(q.datasource);
      return ((_a2 = queryDs.interpolateVariablesInQueries) == null ? void 0 : _a2.call(queryDs, [q], scopedVars != null ? scopedVars : {}, filters)[0]) || q;
    })
  )).filter((promise) => promise.status === "fulfilled").map((q) => q.value).map((q) => {
    var _a2;
    return (_a2 = transform == null ? void 0 : transform(q)) != null ? _a2 : q;
  });
  const queries = interpolatedQueries != null ? interpolatedQueries : [];
  const datasource = (_d = (_c = queries.find((query) => {
    var _a2;
    return !!((_a2 = query.datasource) == null ? void 0 : _a2.uid);
  })) == null ? void 0 : _c.datasource) == null ? void 0 : _d.uid;
  if ((queries == null ? void 0 : queries.length) && datasource && from && to) {
    const left = encodeURIComponent(
      JSON.stringify({
        datasource,
        queries,
        range: {
          from,
          to
        }
      })
    );
    return `/explore?left=${left}`;
  }
  return "";
}

class VizPanelExploreButton extends SceneObjectBase {
  constructor(options = {}) {
    super({ options });
  }
}
VizPanelExploreButton.Component = VizPanelExploreButtonComponent;
function VizPanelExploreButtonComponent({ model }) {
  const { options } = model.useState();
  const { data } = sceneGraph.getData(model).useState();
  const { from, to } = sceneGraph.getTimeRange(model).useState();
  const { value: exploreLink } = reactUse.useAsync(
    async () => data ? getExploreURL(data, model, { from, to }, options.transform) : "",
    [data, model, from, to]
  );
  const returnToPrevious = runtime.useReturnToPrevious();
  if (exploreLink) {
    return /* @__PURE__ */ React__default["default"].createElement(ui.LinkButton, {
      key: "explore",
      icon: "compass",
      size: "sm",
      variant: "secondary",
      href: exploreLink,
      onClick: () => {
        var _a;
        if (options.returnToPrevious) {
          returnToPrevious(options.returnToPrevious.title, options.returnToPrevious.href);
        }
        (_a = options.onClick) == null ? void 0 : _a.call(options);
      }
    }, "Explore");
  }
  return null;
}

const DEFAULT_PANEL_SPAN = 4;
const GRID_CELL_HEIGHT = 30;
const GRID_CELL_VMARGIN = 8;
const GRID_COLUMN_COUNT = 24;

class SceneGridItem extends SceneObjectBase {
}
SceneGridItem.Component = SceneGridItemRenderer;
function SceneGridItemRenderer({ model }) {
  const { body } = model.useState();
  const parent = model.parent;
  if (parent && !isSceneGridLayout(parent) && !isSceneGridRow(parent)) {
    throw new Error("SceneGridItem must be a child of SceneGridLayout or SceneGridRow");
  }
  if (!body) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement(body.Component, {
    model: body
  });
}
function isSceneGridRow(child) {
  return child instanceof SceneGridRow;
}
function isSceneGridLayout(child) {
  return child instanceof SceneGridLayout;
}

var __defProp$b = Object.defineProperty;
var __getOwnPropSymbols$b = Object.getOwnPropertySymbols;
var __hasOwnProp$b = Object.prototype.hasOwnProperty;
var __propIsEnum$b = Object.prototype.propertyIsEnumerable;
var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$b = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$b.call(b, prop))
      __defNormalProp$b(a, prop, b[prop]);
  if (__getOwnPropSymbols$b)
    for (var prop of __getOwnPropSymbols$b(b)) {
      if (__propIsEnum$b.call(b, prop))
        __defNormalProp$b(a, prop, b[prop]);
    }
  return a;
};
var __objRest$1 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$b.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$b)
    for (var prop of __getOwnPropSymbols$b(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$b.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function useUniqueId() {
  var _a;
  const idRefLazy = React.useRef(void 0);
  (_a = idRefLazy.current) != null ? _a : idRefLazy.current = lodash.uniqueId();
  return idRefLazy.current;
}
const LazyLoader = React__default["default"].forwardRef(
  (_a, ref) => {
    var _b = _a, { children, onLoad, onChange, className } = _b, rest = __objRest$1(_b, ["children", "onLoad", "onChange", "className"]);
    const id = useUniqueId();
    const { hideEmpty } = ui.useStyles2(getStyles$6);
    const [loaded, setLoaded] = React.useState(false);
    const [isInView, setIsInView] = React.useState(false);
    const innerRef = React.useRef(null);
    React.useImperativeHandle(ref, () => innerRef.current);
    reactUse.useEffectOnce(() => {
      LazyLoader.addCallback(id, (entry) => {
        if (!loaded && entry.isIntersecting) {
          setLoaded(true);
          onLoad == null ? void 0 : onLoad();
        }
        setIsInView(entry.isIntersecting);
        onChange == null ? void 0 : onChange(entry.isIntersecting);
      });
      const wrapperEl = innerRef.current;
      if (wrapperEl) {
        LazyLoader.observer.observe(wrapperEl);
      }
      return () => {
        wrapperEl && LazyLoader.observer.unobserve(wrapperEl);
        delete LazyLoader.callbacks[id];
        if (Object.keys(LazyLoader.callbacks).length === 0) {
          LazyLoader.observer.disconnect();
        }
      };
    });
    const classes = `${loaded ? hideEmpty : ""} ${className}`;
    return /* @__PURE__ */ React__default["default"].createElement("div", __spreadValues$b({
      id,
      ref: innerRef,
      className: classes
    }, rest), loaded && (typeof children === "function" ? children({ isInView }) : children));
  }
);
function getStyles$6() {
  return {
    hideEmpty: css.css({
      "&:empty": {
        display: "none"
      }
    })
  };
}
LazyLoader.displayName = "LazyLoader";
LazyLoader.callbacks = {};
LazyLoader.addCallback = (id, c) => LazyLoader.callbacks[id] = c;
LazyLoader.observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (typeof LazyLoader.callbacks[entry.target.id] === "function") {
        LazyLoader.callbacks[entry.target.id](entry);
      }
    }
  },
  { rootMargin: "100px" }
);

var __defProp$a = Object.defineProperty;
var __defProps$7 = Object.defineProperties;
var __getOwnPropDescs$7 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$a = Object.getOwnPropertySymbols;
var __hasOwnProp$a = Object.prototype.hasOwnProperty;
var __propIsEnum$a = Object.prototype.propertyIsEnumerable;
var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$a = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$a.call(b, prop))
      __defNormalProp$a(a, prop, b[prop]);
  if (__getOwnPropSymbols$a)
    for (var prop of __getOwnPropSymbols$a(b)) {
      if (__propIsEnum$a.call(b, prop))
        __defNormalProp$a(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$7 = (a, b) => __defProps$7(a, __getOwnPropDescs$7(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$a.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$a)
    for (var prop of __getOwnPropSymbols$a(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$a.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function SceneGridLayoutRenderer({ model }) {
  const { children, isLazy, isDraggable, isResizable } = model.useState();
  const [outerDivRef, { width, height }] = reactUse.useMeasure();
  const ref = React.useRef(null);
  React.useEffect(() => {
    updateAnimationClass(ref, !!isDraggable);
  }, [isDraggable]);
  validateChildrenSize(children);
  const renderGrid = (width2, height2) => {
    if (!width2 || !height2) {
      return null;
    }
    const layout = model.buildGridLayout(width2, height2);
    return /* @__PURE__ */ React__default["default"].createElement("div", {
      ref,
      style: { width: `${width2}px`, height: "100%" },
      className: "react-grid-layout"
    }, /* @__PURE__ */ React__default["default"].createElement(ReactGridLayout__default["default"], {
      width: width2,
      isDraggable: isDraggable && width2 > 768,
      isResizable: isResizable != null ? isResizable : false,
      containerPadding: [0, 0],
      useCSSTransforms: true,
      margin: [GRID_CELL_VMARGIN, GRID_CELL_VMARGIN],
      cols: GRID_COLUMN_COUNT,
      rowHeight: GRID_CELL_HEIGHT,
      draggableHandle: `.grid-drag-handle-${model.state.key}`,
      draggableCancel: ".grid-drag-cancel",
      layout,
      onDragStart: model.onDragStart,
      onDragStop: model.onDragStop,
      onResizeStop: model.onResizeStop,
      onLayoutChange: model.onLayoutChange,
      isBounded: false,
      resizeHandle: /* @__PURE__ */ React__default["default"].createElement(ResizeHandle, null)
    }, layout.map((gridItem, index) => /* @__PURE__ */ React__default["default"].createElement(GridItemWrapper, {
      key: gridItem.i,
      grid: model,
      layoutItem: gridItem,
      index,
      isLazy,
      totalCount: layout.length
    }))));
  };
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    ref: outerDivRef,
    style: { flex: "1 1 auto", position: "relative", zIndex: 1, width: "100%" }
  }, renderGrid(width, height));
}
const GridItemWrapper = React__default["default"].forwardRef((props, ref) => {
  var _b;
  const _a = props, { grid, layoutItem, index, totalCount, isLazy, style, onLoad, onChange, children } = _a, divProps = __objRest(_a, ["grid", "layoutItem", "index", "totalCount", "isLazy", "style", "onLoad", "onChange", "children"]);
  const sceneChild = grid.getSceneLayoutChild(layoutItem.i);
  const className = (_b = sceneChild.getClassName) == null ? void 0 : _b.call(sceneChild);
  const innerContent = /* @__PURE__ */ React__default["default"].createElement(sceneChild.Component, {
    model: sceneChild,
    key: sceneChild.state.key
  });
  if (isLazy) {
    return /* @__PURE__ */ React__default["default"].createElement(LazyLoader, __spreadProps$7(__spreadValues$a({}, divProps), {
      key: sceneChild.state.key,
      "data-griditem-key": sceneChild.state.key,
      className: css.cx(className, props.className),
      style,
      ref
    }), innerContent, children);
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", __spreadProps$7(__spreadValues$a({}, divProps), {
    ref,
    key: sceneChild.state.key,
    "data-griditem-key": sceneChild.state.key,
    className: css.cx(className, props.className),
    style
  }), innerContent, children);
});
GridItemWrapper.displayName = "GridItemWrapper";
function validateChildrenSize(children) {
  if (children.some(
    (c) => c.state.height === void 0 || c.state.width === void 0 || c.state.x === void 0 || c.state.y === void 0
  )) {
    throw new Error("All children must have a size specified");
  }
}
function updateAnimationClass(ref, isDraggable, retry) {
  if (ref.current) {
    if (isDraggable) {
      ref.current.classList.add("react-grid-layout--enable-move-animations");
    } else {
      ref.current.classList.remove("react-grid-layout--enable-move-animations");
    }
  } else if (!retry) {
    setTimeout(() => updateAnimationClass(ref, isDraggable, true), 50);
  }
}
const ResizeHandle = React__default["default"].forwardRef((_a, ref) => {
  var _b = _a, divProps = __objRest(_b, ["handleAxis"]);
  const customCssClass = ui.useStyles2(getResizeHandleStyles);
  return /* @__PURE__ */ React__default["default"].createElement("div", __spreadProps$7(__spreadValues$a({
    ref
  }, divProps), {
    className: `${customCssClass} scene-resize-handle`
  }), /* @__PURE__ */ React__default["default"].createElement("svg", {
    width: "16px",
    height: "16px",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /* @__PURE__ */ React__default["default"].createElement("path", {
    d: "M21 15L15 21M21 8L8 21",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
});
ResizeHandle.displayName = "ResizeHandle";
function getResizeHandleStyles(theme) {
  return css.css({
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 999,
    padding: theme.spacing(1.5, 0, 0, 1.5),
    color: theme.colors.border.strong,
    cursor: "se-resize",
    "&:hover": {
      color: theme.colors.text.link
    },
    svg: {
      display: "block"
    },
    ".react-resizable-hide &": {
      display: "none"
    }
  });
}

var __defProp$9 = Object.defineProperty;
var __defProps$6 = Object.defineProperties;
var __getOwnPropDescs$6 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$9 = Object.getOwnPropertySymbols;
var __hasOwnProp$9 = Object.prototype.hasOwnProperty;
var __propIsEnum$9 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$9 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$9.call(b, prop))
      __defNormalProp$9(a, prop, b[prop]);
  if (__getOwnPropSymbols$9)
    for (var prop of __getOwnPropSymbols$9(b)) {
      if (__propIsEnum$9.call(b, prop))
        __defNormalProp$9(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$6 = (a, b) => __defProps$6(a, __getOwnPropDescs$6(b));
function fitPanelsInHeight(cells, height) {
  const visibleHeight = height - GRID_CELL_VMARGIN * 4;
  const currentGridHeight = Math.max(...cells.map((cell) => cell.h + cell.y));
  const visibleGridHeight = Math.floor(visibleHeight / (GRID_CELL_HEIGHT + GRID_CELL_VMARGIN));
  const scaleFactor = currentGridHeight / visibleGridHeight;
  return cells.map((cell) => {
    return __spreadProps$6(__spreadValues$9({}, cell), {
      y: Math.round(cell.y / scaleFactor) || 0,
      h: Math.round(cell.h / scaleFactor) || 1
    });
  });
}

var __defProp$8 = Object.defineProperty;
var __defProps$5 = Object.defineProperties;
var __getOwnPropDescs$5 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$8 = Object.getOwnPropertySymbols;
var __hasOwnProp$8 = Object.prototype.hasOwnProperty;
var __propIsEnum$8 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$8 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$8.call(b, prop))
      __defNormalProp$8(a, prop, b[prop]);
  if (__getOwnPropSymbols$8)
    for (var prop of __getOwnPropSymbols$8(b)) {
      if (__propIsEnum$8.call(b, prop))
        __defNormalProp$8(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$5 = (a, b) => __defProps$5(a, __getOwnPropDescs$5(b));
const _SceneGridLayout = class extends SceneObjectBase {
  constructor(state) {
    super(__spreadProps$5(__spreadValues$8({}, state), {
      children: sortChildrenByPosition(state.children)
    }));
    this._skipOnLayoutChange = false;
    this._oldLayout = [];
    this._loadOldLayout = false;
    this.onLayoutChange = (layout) => {
      if (this._skipOnLayoutChange) {
        this._skipOnLayoutChange = false;
        return;
      }
      if (this._loadOldLayout) {
        layout = [...this._oldLayout];
        this._loadOldLayout = false;
      }
      for (const item of layout) {
        const child = this.getSceneLayoutChild(item.i);
        const nextSize = {
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h
        };
        if (!isItemSizeEqual(child.state, nextSize)) {
          child.setState(__spreadValues$8({}, nextSize));
        }
      }
      this.setState({ children: sortChildrenByPosition(this.state.children) });
    };
    this.onResizeStop = (_, o, n) => {
      const child = this.getSceneLayoutChild(n.i);
      child.setState({
        width: n.w,
        height: n.h
      });
    };
    this.onDragStart = (gridLayout) => {
      this._oldLayout = [...gridLayout];
    };
    this.onDragStop = (gridLayout, o, updatedItem) => {
      const sceneChild = this.getSceneLayoutChild(updatedItem.i);
      gridLayout = sortGridLayout(gridLayout);
      for (let i = 0; i < gridLayout.length; i++) {
        const gridItem = gridLayout[i];
        const child = this.getSceneLayoutChild(gridItem.i);
        const childSize = child.state;
        if ((childSize == null ? void 0 : childSize.x) !== gridItem.x || (childSize == null ? void 0 : childSize.y) !== gridItem.y) {
          child.setState({
            x: gridItem.x,
            y: gridItem.y
          });
        }
      }
      const indexOfUpdatedItem = gridLayout.findIndex((item) => item.i === updatedItem.i);
      let newParent = this.findGridItemSceneParent(gridLayout, indexOfUpdatedItem - 1);
      let newChildren = this.state.children;
      if (sceneChild instanceof SceneGridRow && newParent instanceof SceneGridRow) {
        if (!this.isRowDropValid(gridLayout, updatedItem, indexOfUpdatedItem)) {
          this._loadOldLayout = true;
        }
        newParent = this;
      }
      if (newParent !== sceneChild.parent) {
        newChildren = this.moveChildTo(sceneChild, newParent);
      }
      this.setState({ children: sortChildrenByPosition(newChildren) });
      this._skipOnLayoutChange = true;
    };
  }
  isDraggable() {
    var _a;
    return (_a = this.state.isDraggable) != null ? _a : false;
  }
  getDragClass() {
    return `grid-drag-handle-${this.state.key}`;
  }
  getDragClassCancel() {
    return `grid-drag-cancel`;
  }
  toggleRow(row) {
    var _a, _b;
    const isCollapsed = row.state.isCollapsed;
    if (!isCollapsed) {
      row.setState({ isCollapsed: true });
      this.setState({});
      return;
    }
    const rowChildren = row.state.children;
    if (rowChildren.length === 0) {
      row.setState({ isCollapsed: false });
      this.setState({});
      return;
    }
    const rowY = row.state.y;
    const firstPanelYPos = (_a = rowChildren[0].state.y) != null ? _a : rowY;
    const yDiff = firstPanelYPos - (rowY + 1);
    let yMax = rowY;
    for (const panel of rowChildren) {
      const newSize = __spreadValues$8({}, panel.state);
      newSize.y = (_b = newSize.y) != null ? _b : rowY;
      newSize.y -= yDiff;
      if (newSize.y !== panel.state.y) {
        panel.setState(newSize);
      }
      yMax = Math.max(yMax, Number(newSize.y) + Number(newSize.height));
    }
    const pushDownAmount = yMax - rowY - 1;
    for (const child of this.state.children) {
      if (child.state.y > rowY) {
        this.pushChildDown(child, pushDownAmount);
      }
      if (isSceneGridRow(child) && child !== row) {
        for (const rowChild of child.state.children) {
          if (rowChild.state.y > rowY) {
            this.pushChildDown(rowChild, pushDownAmount);
          }
        }
      }
    }
    row.setState({ isCollapsed: false });
    this.setState({});
  }
  ignoreLayoutChange(shouldIgnore) {
    this._skipOnLayoutChange = shouldIgnore;
  }
  getSceneLayoutChild(key) {
    for (const child of this.state.children) {
      if (child.state.key === key) {
        return child;
      }
      if (child instanceof SceneGridRow) {
        for (const rowChild of child.state.children) {
          if (rowChild.state.key === key) {
            return rowChild;
          }
        }
      }
    }
    throw new Error("Scene layout child not found for GridItem");
  }
  pushChildDown(child, amount) {
    child.setState({
      y: child.state.y + amount
    });
  }
  findGridItemSceneParent(layout, startAt) {
    for (let i = startAt; i >= 0; i--) {
      const gridItem = layout[i];
      const sceneChild = this.getSceneLayoutChild(gridItem.i);
      if (sceneChild instanceof SceneGridRow) {
        if (sceneChild.state.isCollapsed) {
          return this;
        }
        return sceneChild;
      }
    }
    return this;
  }
  isRowDropValid(gridLayout, updatedItem, indexOfUpdatedItem) {
    if (gridLayout[gridLayout.length - 1].i === updatedItem.i) {
      return true;
    }
    const nextSceneChild = this.getSceneLayoutChild(gridLayout[indexOfUpdatedItem + 1].i);
    if (nextSceneChild instanceof SceneGridRow) {
      return true;
    } else if (nextSceneChild.parent instanceof _SceneGridLayout) {
      return true;
    }
    return false;
  }
  moveChildTo(child, target) {
    const currentParent = child.parent;
    let rootChildren = this.state.children;
    const newChild = child.clone({ key: child.state.key });
    if (currentParent instanceof SceneGridRow) {
      const newRow = currentParent.clone();
      newRow.setState({
        children: newRow.state.children.filter((c) => c.state.key !== child.state.key)
      });
      rootChildren = rootChildren.map((c) => c === currentParent ? newRow : c);
      if (target instanceof SceneGridRow) {
        const targetRow = target.clone();
        targetRow.setState({ children: [...targetRow.state.children, newChild] });
        rootChildren = rootChildren.map((c) => c === target ? targetRow : c);
      } else {
        rootChildren = [...rootChildren, newChild];
      }
    } else {
      if (!(target instanceof _SceneGridLayout)) {
        rootChildren = rootChildren.filter((c) => c.state.key !== child.state.key);
        const targetRow = target.clone();
        targetRow.setState({ children: [...targetRow.state.children, newChild] });
        rootChildren = rootChildren.map((c) => c === target ? targetRow : c);
      }
    }
    return rootChildren;
  }
  toGridCell(child) {
    var _a, _b;
    const size = child.state;
    let x = (_a = size.x) != null ? _a : 0;
    let y = (_b = size.y) != null ? _b : 0;
    const w = Number.isInteger(Number(size.width)) ? Number(size.width) : DEFAULT_PANEL_SPAN;
    const h = Number.isInteger(Number(size.height)) ? Number(size.height) : DEFAULT_PANEL_SPAN;
    let isDraggable = child.state.isDraggable;
    let isResizable = child.state.isResizable;
    if (child instanceof SceneGridRow) {
      isDraggable = child.state.isCollapsed ? true : false;
      isResizable = false;
    }
    return { i: child.state.key, x, y, h, w, isResizable, isDraggable };
  }
  buildGridLayout(width, height) {
    let cells = [];
    for (const child of this.state.children) {
      cells.push(this.toGridCell(child));
      if (child instanceof SceneGridRow && !child.state.isCollapsed) {
        for (const rowChild of child.state.children) {
          cells.push(this.toGridCell(rowChild));
        }
      }
    }
    cells = sortGridLayout(cells);
    if (this.state.UNSAFE_fitPanels) {
      cells = fitPanelsInHeight(cells, height);
    }
    if (width < 768) {
      this._skipOnLayoutChange = true;
      return cells.map((cell) => __spreadProps$5(__spreadValues$8({}, cell), { w: 24 }));
    }
    this._skipOnLayoutChange = false;
    return cells;
  }
};
let SceneGridLayout = _SceneGridLayout;
SceneGridLayout.Component = SceneGridLayoutRenderer;
function isItemSizeEqual(a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function sortChildrenByPosition(children) {
  children.forEach((child) => {
    if (child instanceof SceneGridRow) {
      child.setState({ children: sortChildrenByPosition(child.state.children) });
    }
  });
  return [...children].sort((a, b) => {
    return a.state.y - b.state.y || a.state.x - b.state.x;
  });
}
function sortGridLayout(layout) {
  return [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
}

var __defProp$7 = Object.defineProperty;
var __defProps$4 = Object.defineProperties;
var __getOwnPropDescs$4 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$7 = Object.getOwnPropertySymbols;
var __hasOwnProp$7 = Object.prototype.hasOwnProperty;
var __propIsEnum$7 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$7 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$7.call(b, prop))
      __defNormalProp$7(a, prop, b[prop]);
  if (__getOwnPropSymbols$7)
    for (var prop of __getOwnPropSymbols$7(b)) {
      if (__propIsEnum$7.call(b, prop))
        __defNormalProp$7(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$4 = (a, b) => __defProps$4(a, __getOwnPropDescs$4(b));
class SceneGridRow extends SceneObjectBase {
  constructor(state) {
    super(__spreadProps$4(__spreadValues$7({
      children: state.children || [],
      isCollapsible: state.isCollapsible || true,
      title: state.title || ""
    }, state), {
      x: 0,
      height: 1,
      width: GRID_COLUMN_COUNT
    }));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["title"],
      handleTimeMacros: true
    });
    this.onCollapseToggle = () => {
      if (!this.state.isCollapsible) {
        return;
      }
      this.getGridLayout().toggleRow(this);
    };
  }
  getGridLayout() {
    const layout = this.parent;
    if (!layout || !(layout instanceof SceneGridLayout)) {
      throw new Error("SceneGridRow must be a child of SceneGridLayout");
    }
    return layout;
  }
  getUrlState() {
    return { rowc: this.state.isCollapsed ? "1" : "0" };
  }
  updateFromUrl(values) {
    if (values.rowc == null) {
      return;
    }
    if (values.rowc !== this.getUrlState().rowc) {
      this.onCollapseToggle();
    }
  }
}
SceneGridRow.Component = SceneGridRowRenderer;
function SceneGridRowRenderer({ model }) {
  const styles = ui.useStyles2(getSceneGridRowStyles);
  const { isCollapsible, isCollapsed, title, actions, children } = model.useState();
  const layout = model.getGridLayout();
  const layoutDragClass = layout.getDragClass();
  const isDraggable = layout.isDraggable();
  const count = children ? children.length : 0;
  const panels = count === 1 ? "panel" : "panels";
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: css.cx(styles.row, isCollapsed && styles.rowCollapsed) + " oodle-panel-row oodle-panel-row-" + (isCollapsed ? "closed" : "open")
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.rowTitleAndActionsGroup
  }, /* @__PURE__ */ React__default["default"].createElement("button", {
    onClick: model.onCollapseToggle,
    className: styles.rowTitleButton,
    "aria-label": isCollapsed ? "Expand row" : "Collapse row",
    "data-testid": e2eSelectors.selectors.components.DashboardRow.title(sceneGraph.interpolate(model, title, void 0, "text"))
  }, isCollapsible && /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
    name: isCollapsed ? "angle-right" : "angle-down"
  }), /* @__PURE__ */ React__default["default"].createElement("span", {
    className: styles.rowTitle,
    role: "heading"
  }, sceneGraph.interpolate(model, title, void 0, "text"))), /* @__PURE__ */ React__default["default"].createElement("span", {
    className: css.cx(styles.panelCount, isCollapsed && styles.panelCountCollapsed)
  }, "(", count, " ", panels, ")"), actions && /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.rowActions
  }, /* @__PURE__ */ React__default["default"].createElement(actions.Component, {
    model: actions
  }))), isDraggable && isCollapsed && /* @__PURE__ */ React__default["default"].createElement("div", {
    className: css.cx(styles.dragHandle, layoutDragClass)
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
    name: "draggabledots"
  })));
}
const getSceneGridRowStyles = (theme) => {
  return {
    row: css.css({
      width: "100%",
      height: "30px",
      display: "flex",
      justifyContent: "space-between",
      gap: theme.spacing(1)
    }),
    rowTitleButton: css.css({
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      minWidth: 0,
      gap: theme.spacing(1)
    }),
    rowCollapsed: css.css({
      borderBottom: `1px solid ${theme.colors.border.weak}`
    }),
    rowTitle: css.css({
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
      flexGrow: 1,
      minWidth: 0
    }),
    collapsedInfo: css.css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      display: "flex",
      alignItems: "center",
      flexGrow: 1
    }),
    rowTitleAndActionsGroup: css.css({
      display: "flex",
      minWidth: 0,
      "&:hover, &:focus-within": {
        "& > div": {
          opacity: 1
        }
      }
    }),
    rowActions: css.css({
      display: "flex",
      whiteSpace: "nowrap",
      opacity: 0,
      transition: "200ms opacity ease-in 200ms",
      "&:hover, &:focus-within": {
        opacity: 1
      }
    }),
    dragHandle: css.css({
      display: "flex",
      padding: theme.spacing(0, 1),
      alignItems: "center",
      justifyContent: "flex-end",
      cursor: "move",
      color: theme.colors.text.secondary,
      "&:hover": {
        color: theme.colors.text.primary
      }
    }),
    panelCount: css.css({
      whiteSpace: "nowrap",
      paddingLeft: theme.spacing(2),
      color: theme.colors.text.secondary,
      fontStyle: "italic",
      fontSize: theme.typography.size.sm,
      fontWeight: "normal",
      display: "none",
      lineHeight: "30px"
    }),
    panelCountCollapsed: css.css({
      display: "inline-block"
    })
  };
};

class NestedScene extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this.onToggle = () => {
      this.setState({
        isCollapsed: !this.state.isCollapsed
      });
    };
    this.onRemove = () => {
      const parent = this.parent;
      if (isSceneLayoutItem(parent)) {
        parent.setState({
          body: void 0
        });
      }
    };
  }
}
NestedScene.Component = NestedSceneRenderer;
function NestedSceneRenderer({ model }) {
  const { title, isCollapsed, canCollapse, canRemove, body, controls } = model.useState();
  const gridRow = ui.useStyles2(getSceneGridRowStyles);
  const styles = ui.useStyles2(getStyles$5);
  const toolbarControls = (controls != null ? controls : []).map((action) => /* @__PURE__ */ React__default["default"].createElement(action.Component, {
    key: action.state.key,
    model: action
  }));
  if (canRemove) {
    toolbarControls.push(
      /* @__PURE__ */ React__default["default"].createElement(ui.ToolbarButton, {
        icon: "times",
        variant: "default",
        onClick: model.onRemove,
        key: "remove-button",
        "aria-label": "Remove scene"
      })
    );
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.wrapper
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: css.cx(styles.row, isCollapsed && styles.rowCollapsed)
  }, /* @__PURE__ */ React__default["default"].createElement("button", {
    onClick: model.onToggle,
    className: gridRow.rowTitleButton,
    "aria-label": isCollapsed ? "Expand scene" : "Collapse scene"
  }, canCollapse && /* @__PURE__ */ React__default["default"].createElement(ui.Icon, {
    name: isCollapsed ? "angle-right" : "angle-down"
  }), /* @__PURE__ */ React__default["default"].createElement("span", {
    className: gridRow.rowTitle,
    role: "heading"
  }, sceneGraph.interpolate(model, title, void 0, "text"))), /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.actions
  }, toolbarControls)), !isCollapsed && /* @__PURE__ */ React__default["default"].createElement(body.Component, {
    model: body
  }));
}
const getStyles$5 = (theme) => ({
  wrapper: css.css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: theme.spacing(1)
  }),
  row: css.css({
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing(1)
  }),
  rowCollapsed: css.css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    paddingBottom: theme.spacing(1)
  }),
  actions: css.css({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
    flexGrow: 1
  })
});
function isSceneLayoutItem(x) {
  return "body" in x.state;
}

class SceneCanvasText extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this._variableDependency = new VariableDependencyConfig(this, { statePaths: ["text"] });
  }
}
SceneCanvasText.Component = ({ model }) => {
  const { text, fontSize = 20, align = "left", key, spacing } = model.useState();
  const theme = ui.useTheme2();
  const style = css.css({
    fontSize,
    display: "flex",
    flexGrow: 1,
    alignItems: "center",
    padding: spacing ? theme.spacing(spacing, 0) : void 0,
    justifyContent: align
  });
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: style,
    "data-testid": key
  }, sceneGraph.interpolate(model, text));
};

class SceneToolbarButton extends SceneObjectBase {
}
SceneToolbarButton.Component = ({ model }) => {
  const state = model.useState();
  return /* @__PURE__ */ React__default["default"].createElement(ui.ToolbarButton, {
    onClick: state.onClick,
    icon: state.icon
  });
};
class SceneToolbarInput extends SceneObjectBase {
}
SceneToolbarInput.Component = ({ model }) => {
  const state = model.useState();
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    style: { display: "flex" }
  }, state.label && /* @__PURE__ */ React__default["default"].createElement(ControlsLabel, {
    label: state.label
  }), /* @__PURE__ */ React__default["default"].createElement(ui.Input, {
    defaultValue: state.value,
    width: 8,
    onBlur: (evt) => {
      model.state.onChange(parseInt(evt.currentTarget.value, 10));
    }
  }));
};

class SceneTimePicker extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this.onZoom = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const zoomedTimeRange = getZoomedTimeRange(timeRange.state.value, 2);
      timeRange.onTimeRangeChange(zoomedTimeRange);
    };
    this.onChangeFiscalYearStartMonth = (month) => {
      const timeRange = sceneGraph.getTimeRange(this);
      timeRange.setState({ fiscalYearStartMonth: month });
    };
    this.toAbsolute = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const timeRangeVal = timeRange.state.value;
      const from = data.toUtc(timeRangeVal.from);
      const to = data.toUtc(timeRangeVal.to);
      timeRange.onTimeRangeChange({ from, to, raw: { from, to } });
    };
    this.onMoveBackward = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const {
        state: { value: range }
      } = timeRange;
      timeRange.onTimeRangeChange(getShiftedTimeRange(TimeRangeDirection.Backward, range, Date.now()));
    };
    this.onMoveForward = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const {
        state: { value: range }
      } = timeRange;
      timeRange.onTimeRangeChange(getShiftedTimeRange(TimeRangeDirection.Forward, range, Date.now()));
    };
  }
}
SceneTimePicker.Component = SceneTimePickerRenderer;
function SceneTimePickerRenderer({ model }) {
  const { hidePicker, isOnCanvas } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeZone = timeRange.getTimeZone();
  const timeRangeState = timeRange.useState();
  const [timeRangeHistory, setTimeRangeHistory] = reactUse.useLocalStorage(HISTORY_LOCAL_STORAGE_KEY, [], {
    raw: false,
    serializer: serializeHistory,
    deserializer: deserializeHistory
  });
  if (hidePicker) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement(ui.TimeRangePicker, {
    isOnCanvas: isOnCanvas != null ? isOnCanvas : true,
    value: timeRangeState.value,
    onChange: (range) => {
      if (isAbsolute(range)) {
        setTimeRangeHistory([range, ...timeRangeHistory != null ? timeRangeHistory : []]);
      }
      timeRange.onTimeRangeChange(range);
    },
    timeZone,
    fiscalYearStartMonth: timeRangeState.fiscalYearStartMonth,
    onMoveBackward: model.onMoveBackward,
    onMoveForward: model.onMoveForward,
    onZoom: model.onZoom,
    onChangeTimeZone: timeRange.onTimeZoneChange,
    onChangeFiscalYearStartMonth: model.onChangeFiscalYearStartMonth,
    weekStart: timeRangeState.weekStart,
    history: timeRangeHistory
  });
}
function getZoomedTimeRange(timeRange, factor) {
  const timespan = timeRange.to.valueOf() - timeRange.from.valueOf();
  const center = timeRange.to.valueOf() - timespan / 2;
  const newTimespan = timespan === 0 ? 3e4 : timespan * factor;
  const to = center + newTimespan / 2;
  const from = center - newTimespan / 2;
  return { from: data.toUtc(from), to: data.toUtc(to), raw: { from: data.toUtc(from), to: data.toUtc(to) } };
}
var TimeRangeDirection = /* @__PURE__ */ ((TimeRangeDirection2) => {
  TimeRangeDirection2[TimeRangeDirection2["Backward"] = 0] = "Backward";
  TimeRangeDirection2[TimeRangeDirection2["Forward"] = 1] = "Forward";
  return TimeRangeDirection2;
})(TimeRangeDirection || {});
function getShiftedTimeRange(dir, timeRange, upperLimit) {
  const oldTo = timeRange.to.valueOf();
  const oldFrom = timeRange.from.valueOf();
  const halfSpan = (oldTo - oldFrom) / 2;
  let fromRaw;
  let toRaw;
  if (dir === 0 /* Backward */) {
    fromRaw = oldFrom - halfSpan;
    toRaw = oldTo - halfSpan;
  } else {
    fromRaw = oldFrom + halfSpan;
    toRaw = oldTo + halfSpan;
    if (toRaw > upperLimit && oldTo < upperLimit) {
      toRaw = upperLimit;
      fromRaw = oldFrom;
    }
  }
  const from = data.toUtc(fromRaw);
  const to = data.toUtc(toRaw);
  return {
    from,
    to,
    raw: { from, to }
  };
}
const HISTORY_LOCAL_STORAGE_KEY = "grafana.dashboard.timepicker.history";
function deserializeHistory(value) {
  const values = JSON.parse(value);
  return values.map((item) => data.rangeUtil.convertRawToRange(item, "utc", void 0, "YYYY-MM-DD HH:mm:ss"));
}
function serializeHistory(values) {
  return JSON.stringify(
    limit(
      values.map((v) => ({
        from: typeof v.raw.from === "string" ? v.raw.from : v.raw.from.toISOString(),
        to: typeof v.raw.to === "string" ? v.raw.to : v.raw.to.toISOString()
      }))
    )
  );
}
function limit(value) {
  return lodash.uniqBy(value, (v) => v.from + v.to).slice(0, 4);
}
function isAbsolute(value) {
  return data.isDateTime(value.raw.from) || data.isDateTime(value.raw.to);
}

var __defProp$6 = Object.defineProperty;
var __defProps$3 = Object.defineProperties;
var __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$6 = Object.getOwnPropertySymbols;
var __hasOwnProp$6 = Object.prototype.hasOwnProperty;
var __propIsEnum$6 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$6 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$6.call(b, prop))
      __defNormalProp$6(a, prop, b[prop]);
  if (__getOwnPropSymbols$6)
    for (var prop of __getOwnPropSymbols$6(b)) {
      if (__propIsEnum$6.call(b, prop))
        __defNormalProp$6(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$3 = (a, b) => __defProps$3(a, __getOwnPropDescs$3(b));
const DEFAULT_INTERVALS = ["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h", "2h", "1d"];
class SceneRefreshPicker extends SceneObjectBase {
  constructor(state) {
    var _a, _b, _c;
    const filterDissalowedIntervals = (i) => {
      var _a2;
      const minInterval = (_a2 = state.minRefreshInterval) != null ? _a2 : runtime.config.minRefreshInterval;
      try {
        return minInterval ? data.rangeUtil.intervalToMs(i) >= data.rangeUtil.intervalToMs(minInterval) : true;
      } catch (e) {
        return false;
      }
    };
    super(__spreadProps$3(__spreadValues$6({
      refresh: ""
    }, state), {
      autoValue: void 0,
      autoEnabled: (_a = state.autoEnabled) != null ? _a : true,
      autoMinInterval: (_b = state.autoMinInterval) != null ? _b : runtime.config.minRefreshInterval,
      intervals: ((_c = state.intervals) != null ? _c : DEFAULT_INTERVALS).filter(filterDissalowedIntervals)
    }));
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: ["refresh"] });
    this._autoRefreshBlocked = false;
    this.onRefresh = () => {
      const queryController = sceneGraph.getQueryController(this);
      if (queryController == null ? void 0 : queryController.state.isRunning) {
        queryController.cancelAll();
        return;
      }
      const timeRange = sceneGraph.getTimeRange(this);
      if (this._intervalTimer) {
        clearInterval(this._intervalTimer);
      }
      timeRange.onRefresh();
      this.setupIntervalTimer();
    };
    this.onIntervalChanged = (interval) => {
      this.setState({ refresh: interval });
      this.setupIntervalTimer();
    };
    this.setupAutoTimeRangeListener = () => {
      return sceneGraph.getTimeRange(this).subscribeToState((newState, prevState) => {
        if (newState.from !== prevState.from || newState.to !== prevState.to) {
          this.setupIntervalTimer();
        }
      });
    };
    this.calculateAutoRefreshInterval = () => {
      var _a;
      const timeRange = sceneGraph.getTimeRange(this);
      const resolution = (_a = window == null ? void 0 : window.innerWidth) != null ? _a : 2e3;
      return data.rangeUtil.calculateInterval(timeRange.state.value, resolution, this.state.autoMinInterval);
    };
    this.setupIntervalTimer = () => {
      var _a;
      const timeRange = sceneGraph.getTimeRange(this);
      const { refresh, intervals } = this.state;
      if (this._intervalTimer || refresh === "") {
        clearInterval(this._intervalTimer);
      }
      if (refresh === "") {
        return;
      }
      if (refresh !== ui.RefreshPicker.autoOption.value && intervals && !intervals.includes(refresh)) {
        return;
      }
      let intervalMs;
      (_a = this._autoTimeRangeListener) == null ? void 0 : _a.unsubscribe();
      if (refresh === ui.RefreshPicker.autoOption.value) {
        const autoRefreshInterval = this.calculateAutoRefreshInterval();
        intervalMs = autoRefreshInterval.intervalMs;
        this._autoTimeRangeListener = this.setupAutoTimeRangeListener();
        if (autoRefreshInterval.interval !== this.state.autoValue) {
          this.setState({ autoValue: autoRefreshInterval.interval });
        }
      } else {
        intervalMs = data.rangeUtil.intervalToMs(refresh);
      }
      this._intervalTimer = setInterval(() => {
        if (this.isTabVisible()) {
          timeRange.onRefresh();
        } else {
          this._autoRefreshBlocked = true;
        }
      }, intervalMs);
    };
    this.addActivationHandler(() => {
      this.setupIntervalTimer();
      const onVisibilityChange = () => {
        if (this._autoRefreshBlocked && document.visibilityState === "visible") {
          this._autoRefreshBlocked = false;
          this.onRefresh();
        }
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      return () => {
        var _a2;
        if (this._intervalTimer) {
          clearInterval(this._intervalTimer);
        }
        document.removeEventListener("visibilitychange", onVisibilityChange);
        (_a2 = this._autoTimeRangeListener) == null ? void 0 : _a2.unsubscribe();
      };
    });
  }
  getUrlState() {
    let refresh = this.state.refresh;
    if (typeof refresh !== "string" || refresh.length === 0) {
      refresh = void 0;
    }
    return { refresh };
  }
  updateFromUrl(values) {
    const { intervals } = this.state;
    let refresh = values.refresh;
    if (typeof refresh === "string" && isIntervalString(refresh)) {
      if (intervals == null ? void 0 : intervals.includes(refresh)) {
        this.setState({ refresh });
      } else {
        this.setState({
          refresh: intervals ? intervals[0] : void 0
        });
      }
    }
  }
  isTabVisible() {
    return document.visibilityState === void 0 || document.visibilityState === "visible";
  }
}
SceneRefreshPicker.Component = SceneRefreshPickerRenderer;
function SceneRefreshPickerRenderer({ model }) {
  var _a;
  const { refresh, intervals, autoEnabled, autoValue, isOnCanvas, primary, withText } = model.useState();
  const isRunning = useQueryControllerState(model);
  let text = refresh === ((_a = ui.RefreshPicker.autoOption) == null ? void 0 : _a.value) ? autoValue : withText ? "Refresh" : void 0;
  let tooltip;
  let width;
  if (isRunning) {
    tooltip = "Cancel all queries";
    if (withText) {
      text = "Cancel";
    }
  }
  if (withText) {
    width = "96px";
  }
  return /* @__PURE__ */ React__default["default"].createElement(ui.RefreshPicker, {
    showAutoInterval: autoEnabled,
    value: refresh,
    intervals,
    tooltip,
    width,
    text,
    onRefresh: model.onRefresh,
    primary,
    onIntervalChanged: model.onIntervalChanged,
    isLoading: isRunning,
    isOnCanvas: isOnCanvas != null ? isOnCanvas : true
  });
}
function useQueryControllerState(model) {
  const queryController = sceneGraph.getQueryController(model);
  if (!queryController) {
    return false;
  }
  return queryController.useState().isRunning;
}
function isIntervalString(str) {
  try {
    const res = data.rangeUtil.describeInterval(str);
    return res.count > 0;
  } catch (e) {
    return false;
  }
}

const getCompareSeriesRefId = (refId) => `${refId}-compare`;

var __defProp$5 = Object.defineProperty;
var __defProps$2 = Object.defineProperties;
var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$5 = Object.getOwnPropertySymbols;
var __hasOwnProp$5 = Object.prototype.hasOwnProperty;
var __propIsEnum$5 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$5 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$5.call(b, prop))
      __defNormalProp$5(a, prop, b[prop]);
  if (__getOwnPropSymbols$5)
    for (var prop of __getOwnPropSymbols$5(b)) {
      if (__propIsEnum$5.call(b, prop))
        __defNormalProp$5(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
const PREVIOUS_PERIOD_VALUE = "__previousPeriod";
const NO_PERIOD_VALUE = "__noPeriod";
const PREVIOUS_PERIOD_COMPARE_OPTION = {
  label: "Previous period",
  value: PREVIOUS_PERIOD_VALUE
};
const NO_COMPARE_OPTION = {
  label: "No comparison",
  value: NO_PERIOD_VALUE
};
const DEFAULT_COMPARE_OPTIONS = [
  { label: "Day before", value: "24h" },
  { label: "Week before", value: "1w" },
  { label: "Month before", value: "1M" }
];
class SceneTimeRangeCompare extends SceneObjectBase {
  constructor(state) {
    super(__spreadValues$5({ compareOptions: DEFAULT_COMPARE_OPTIONS }, state));
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: ["compareWith"] });
    this._onActivate = () => {
      const sceneTimeRange = sceneGraph.getTimeRange(this);
      this.setState({ compareOptions: this.getCompareOptions(sceneTimeRange.state.value) });
      this._subs.add(
        sceneTimeRange.subscribeToState((timeRange) => {
          const compareOptions = this.getCompareOptions(timeRange.value);
          const stateUpdate = { compareOptions };
          if (Boolean(this.state.compareWith) && !compareOptions.find(({ value }) => value === this.state.compareWith)) {
            stateUpdate.compareWith = PREVIOUS_PERIOD_VALUE;
          }
          this.setState(stateUpdate);
        })
      );
    };
    this.getCompareOptions = (timeRange) => {
      const diffDays = Math.ceil(timeRange.to.diff(timeRange.from));
      const matchIndex = DEFAULT_COMPARE_OPTIONS.findIndex(({ value }) => {
        const intervalInMs = data.rangeUtil.intervalToMs(value);
        return intervalInMs >= diffDays;
      });
      return [
        NO_COMPARE_OPTION,
        PREVIOUS_PERIOD_COMPARE_OPTION,
        ...DEFAULT_COMPARE_OPTIONS.slice(matchIndex).map(({ label, value }) => ({ label, value }))
      ];
    };
    this.onCompareWithChanged = (compareWith) => {
      if (compareWith === NO_PERIOD_VALUE) {
        this.onClearCompare();
      } else {
        this.setState({ compareWith });
      }
    };
    this.onClearCompare = () => {
      this.setState({ compareWith: void 0 });
    };
    this.addActivationHandler(this._onActivate);
  }
  getExtraQueries(request) {
    const extraQueries = [];
    const compareRange = this.getCompareTimeRange(request.range);
    if (!compareRange) {
      return extraQueries;
    }
    const targets = request.targets.filter((query) => query.timeRangeCompare !== false);
    if (targets.length) {
      extraQueries.push({
        req: __spreadProps$2(__spreadValues$5({}, request), {
          targets,
          range: compareRange
        }),
        processor: timeShiftAlignmentProcessor
      });
    }
    return extraQueries;
  }
  shouldRerun(prev, next, queries) {
    return prev.compareWith !== next.compareWith && queries.find((query) => query.timeRangeCompare !== false) !== void 0;
  }
  getCompareTimeRange(timeRange) {
    let compareFrom;
    let compareTo;
    if (this.state.compareWith) {
      if (this.state.compareWith === PREVIOUS_PERIOD_VALUE) {
        const diffMs = timeRange.to.diff(timeRange.from);
        compareFrom = data.dateTime(timeRange.from).subtract(diffMs);
        compareTo = data.dateTime(timeRange.to).subtract(diffMs);
      } else {
        compareFrom = data.dateTime(timeRange.from).subtract(data.rangeUtil.intervalToMs(this.state.compareWith));
        compareTo = data.dateTime(timeRange.to).subtract(data.rangeUtil.intervalToMs(this.state.compareWith));
      }
      return {
        from: compareFrom,
        to: compareTo,
        raw: {
          from: compareFrom,
          to: compareTo
        }
      };
    }
    return void 0;
  }
  getUrlState() {
    return {
      compareWith: this.state.compareWith
    };
  }
  updateFromUrl(values) {
    if (!values.compareWith) {
      return;
    }
    const compareWith = parseUrlParam(values.compareWith);
    if (compareWith) {
      const compareOptions = this.getCompareOptions(sceneGraph.getTimeRange(this).state.value);
      if (compareOptions.find(({ value }) => value === compareWith)) {
        this.setState({
          compareWith
        });
      } else {
        this.setState({
          compareWith: "__previousPeriod"
        });
      }
    }
  }
}
SceneTimeRangeCompare.Component = SceneTimeRangeCompareRenderer;
const timeShiftAlignmentProcessor = (primary, secondary) => {
  const diff = secondary.timeRange.from.diff(primary.timeRange.from);
  secondary.series.forEach((series) => {
    series.refId = getCompareSeriesRefId(series.refId || "");
    series.meta = __spreadProps$2(__spreadValues$5({}, series.meta), {
      timeCompare: {
        diffMs: diff,
        isTimeShiftQuery: true
      }
    });
    series.fields.forEach((field) => {
      if (field.type === data.FieldType.time) {
        field.values = field.values.map((v) => {
          return diff < 0 ? v - diff : v + diff;
        });
      }
      field.config = __spreadProps$2(__spreadValues$5({}, field.config), {
        color: {
          mode: "fixed",
          fixedColor: runtime.config.theme.palette.gray60
        }
      });
      return field;
    });
  });
  return rxjs.of(secondary);
};
function SceneTimeRangeCompareRenderer({ model }) {
  var _a;
  const styles = ui.useStyles2(getStyles$4);
  const { compareWith, compareOptions } = model.useState();
  const [previousCompare, setPreviousCompare] = React__default["default"].useState(compareWith);
  const previousValue = (_a = compareOptions.find(({ value: value2 }) => value2 === previousCompare)) != null ? _a : PREVIOUS_PERIOD_COMPARE_OPTION;
  const value = compareOptions.find(({ value: value2 }) => value2 === compareWith);
  const enabled = Boolean(value);
  const onClick = () => {
    if (enabled) {
      setPreviousCompare(compareWith);
      model.onClearCompare();
    } else if (!enabled) {
      model.onCompareWithChanged(previousValue.value);
    }
  };
  return /* @__PURE__ */ React__default["default"].createElement(ui.ButtonGroup, null, /* @__PURE__ */ React__default["default"].createElement(ui.ToolbarButton, {
    variant: "canvas",
    tooltip: "Enable time frame comparison",
    onClick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    }
  }, /* @__PURE__ */ React__default["default"].createElement(ui.Checkbox, {
    label: " ",
    value: enabled,
    onClick
  }), "Comparison"), enabled ? /* @__PURE__ */ React__default["default"].createElement(ui.ButtonSelect, {
    variant: "canvas",
    value,
    options: compareOptions,
    onChange: (v) => {
      model.onCompareWithChanged(v.value);
    }
  }) : /* @__PURE__ */ React__default["default"].createElement(ui.ToolbarButton, {
    className: styles.previewButton,
    disabled: true,
    variant: "canvas",
    isOpen: false
  }, previousValue.label));
}
function getStyles$4(theme) {
  return {
    previewButton: css.css({
      "&:disabled": {
        border: `1px solid ${theme.colors.secondary.border}`,
        color: theme.colors.text.disabled,
        opacity: 1
      }
    })
  };
}

class SceneByFrameRepeater extends SceneObjectBase {
  constructor(state) {
    super(state);
    this.addActivationHandler(() => {
      const dataProvider = sceneGraph.getData(this);
      this._subs.add(
        dataProvider.subscribeToState((data$1) => {
          var _a;
          if (((_a = data$1.data) == null ? void 0 : _a.state) === data.LoadingState.Done) {
            this.performRepeat(data$1.data);
          }
        })
      );
      if (dataProvider.state.data) {
        this.performRepeat(dataProvider.state.data);
      }
    });
  }
  performRepeat(data) {
    const newChildren = [];
    for (let seriesIndex = 0; seriesIndex < data.series.length; seriesIndex++) {
      const layoutChild = this.state.getLayoutChild(data, data.series[seriesIndex], seriesIndex);
      newChildren.push(layoutChild);
    }
    this.state.body.setState({ children: newChildren });
  }
}
SceneByFrameRepeater.Component = ({ model }) => {
  const { body } = model.useState();
  return /* @__PURE__ */ React__default["default"].createElement(body.Component, {
    model: body
  });
};

class SceneByVariableRepeater extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._variableDependency = new VariableDependencyConfig(
      this,
      {
        variableNames: [this.state.variableName],
        onVariableUpdateCompleted: () => this.performRepeat()
      }
    );
    this.addActivationHandler(() => this.performRepeat());
  }
  performRepeat() {
    if (this._variableDependency.hasDependencyInLoadingState()) {
      return;
    }
    const variable = sceneGraph.lookupVariable(this.state.variableName, this);
    if (!(variable instanceof MultiValueVariable)) {
      console.error("SceneByVariableRepeater: variable is not a MultiValueVariable");
      return;
    }
    const values = getMultiVariableValues(variable);
    const newChildren = [];
    for (const option of values) {
      const layoutChild = this.state.getLayoutChild(option);
      newChildren.push(layoutChild);
    }
    this.state.body.setState({ children: newChildren });
  }
}
SceneByVariableRepeater.Component = ({ model }) => {
  const { body } = model.useState();
  return /* @__PURE__ */ React__default["default"].createElement(body.Component, {
    model: body
  });
};
function getMultiVariableValues(variable) {
  const { value, text, options } = variable.state;
  if (variable.hasAllValue()) {
    return options;
  }
  if (Array.isArray(value) && Array.isArray(text)) {
    return value.map((v, i) => ({ value: v, label: text[i] }));
  }
  return [{ value, label: text }];
}

class SceneControlsSpacer extends SceneObjectBase {
  constructor() {
    super({});
    this._renderBeforeActivation = true;
  }
}
SceneControlsSpacer.Component = (_props) => {
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    style: { flexGrow: 1 }
  });
};

class SceneFlexLayout extends SceneObjectBase {
  toggleDirection() {
    this.setState({
      direction: this.state.direction === "row" ? "column" : "row"
    });
  }
  isDraggable() {
    return false;
  }
}
SceneFlexLayout.Component = SceneFlexLayoutRenderer;
function SceneFlexLayoutRenderer({ model, parentState }) {
  const { children, isHidden } = model.useState();
  const style = useLayoutStyle$1(model.state, parentState);
  if (isHidden) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: style
  }, children.map((item) => {
    const Component = item.Component;
    return /* @__PURE__ */ React__default["default"].createElement(Component, {
      key: item.state.key,
      model: item,
      parentState: model.state
    });
  }));
}
class SceneFlexItem extends SceneObjectBase {
}
SceneFlexItem.Component = SceneFlexItemRenderer;
function SceneFlexItemRenderer({ model, parentState }) {
  if (!parentState) {
    throw new Error("SceneFlexItem must be a child of SceneFlexLayout");
  }
  const { body, isHidden } = model.useState();
  const style = useLayoutItemStyle(model.state, parentState);
  if (!body || isHidden) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: style
  }, /* @__PURE__ */ React__default["default"].createElement(body.Component, {
    model: body
  }));
}
function applyItemStyles(style, state, parentState) {
  var _a, _b, _c;
  const parentDirection = (_a = parentState.direction) != null ? _a : "row";
  const { xSizing = "fill", ySizing = "fill" } = state;
  style.display = "flex";
  style.position = "relative";
  style.flexDirection = parentDirection;
  if (parentDirection === "column") {
    if (state.height) {
      style.height = state.height;
    } else {
      style.flexGrow = ySizing === "fill" ? 1 : 0;
    }
    if (state.width) {
      style.width = state.width;
    } else {
      style.alignSelf = xSizing === "fill" ? "stretch" : "flex-start";
    }
  } else {
    if (state.height) {
      style.height = state.height;
    } else {
      style.alignSelf = ySizing === "fill" ? "stretch" : "flex-start";
    }
    if (state.width) {
      style.width = state.width;
    } else {
      style.flexGrow = xSizing === "fill" ? 1 : 0;
    }
  }
  style.minWidth = state.minWidth;
  style.maxWidth = state.maxWidth;
  style.maxHeight = state.maxHeight;
  style.minHeight = (_b = state.minHeight) != null ? _b : parentState.minHeight;
  style.height = (_c = state.height) != null ? _c : parentState.height;
  return style;
}
function useLayoutItemStyle(state, parentState) {
  return React.useMemo(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const theme = runtime.config.theme2;
    const style = applyItemStyles({}, state, parentState);
    style[theme.breakpoints.down("md")] = {
      maxWidth: (_b = (_a = state.md) == null ? void 0 : _a.maxWidth) != null ? _b : "unset",
      maxHeight: (_d = (_c = state.md) == null ? void 0 : _c.maxHeight) != null ? _d : "unset",
      height: (_g = (_e = state.md) == null ? void 0 : _e.height) != null ? _g : (_f = parentState.md) == null ? void 0 : _f.height,
      width: (_j = (_h = state.md) == null ? void 0 : _h.width) != null ? _j : (_i = parentState.md) == null ? void 0 : _i.width
    };
    return css.css(style);
  }, [state, parentState]);
}
function useLayoutStyle$1(state, parentState) {
  return React.useMemo(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const { direction = "row", wrap } = state;
    const theme = runtime.config.theme2;
    const style = {};
    if (parentState) {
      applyItemStyles(style, state, parentState);
    } else {
      style.display = "flex";
      style.flexGrow = 1;
      style.minWidth = state.minWidth;
      style.minHeight = state.minHeight;
    }
    style.flexDirection = direction;
    style.gap = "8px";
    style.flexWrap = wrap || "nowrap";
    style.alignContent = "baseline";
    style.minWidth = style.minWidth || 0;
    style.minHeight = style.minHeight || 0;
    style[theme.breakpoints.down("md")] = {
      flexDirection: (_b = (_a = state.md) == null ? void 0 : _a.direction) != null ? _b : "column",
      maxWidth: (_d = (_c = state.md) == null ? void 0 : _c.maxWidth) != null ? _d : "unset",
      maxHeight: (_f = (_e = state.md) == null ? void 0 : _e.maxHeight) != null ? _f : "unset",
      height: (_h = (_g = state.md) == null ? void 0 : _g.height) != null ? _h : "unset",
      width: (_j = (_i = state.md) == null ? void 0 : _i.width) != null ? _j : "unset"
    };
    return css.css(style);
  }, [parentState, state]);
}

var __defProp$4 = Object.defineProperty;
var __getOwnPropSymbols$4 = Object.getOwnPropertySymbols;
var __hasOwnProp$4 = Object.prototype.hasOwnProperty;
var __propIsEnum$4 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$4 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$4.call(b, prop))
      __defNormalProp$4(a, prop, b[prop]);
  if (__getOwnPropSymbols$4)
    for (var prop of __getOwnPropSymbols$4(b)) {
      if (__propIsEnum$4.call(b, prop))
        __defNormalProp$4(a, prop, b[prop]);
    }
  return a;
};
class SceneCSSGridLayout extends SceneObjectBase {
  constructor(state) {
    var _a, _b;
    super(__spreadValues$4({
      rowGap: 1,
      columnGap: 1,
      templateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
      autoRows: (_a = state.autoRows) != null ? _a : `320px`,
      children: (_b = state.children) != null ? _b : []
    }, state));
  }
  isDraggable() {
    return false;
  }
}
SceneCSSGridLayout.Component = SceneCSSGridLayoutRenderer;
function SceneCSSGridLayoutRenderer({ model }) {
  const { children, isHidden, isLazy } = model.useState();
  const style = useLayoutStyle(model.state);
  if (isHidden) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: style
  }, children.map((item) => {
    const Component = item.Component;
    if (isLazy) {
      return /* @__PURE__ */ React__default["default"].createElement(LazyLoader, {
        key: item.state.key,
        className: style
      }, /* @__PURE__ */ React__default["default"].createElement(Component, {
        key: item.state.key,
        model: item,
        parentState: model.state
      }));
    }
    return /* @__PURE__ */ React__default["default"].createElement(Component, {
      key: item.state.key,
      model: item,
      parentState: model.state
    });
  }));
}
class SceneCSSGridItem extends SceneObjectBase {
}
SceneCSSGridItem.Component = SceneCSSGridItemRenderer;
function SceneCSSGridItemRenderer({ model, parentState }) {
  if (!parentState) {
    throw new Error("SceneCSSGridItem must be a child of SceneCSSGridLayout");
  }
  const { body, isHidden } = model.useState();
  const style = useItemStyle(model.state);
  if (!body || isHidden) {
    return null;
  }
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: style
  }, /* @__PURE__ */ React__default["default"].createElement(body.Component, {
    model: body
  }));
}
function useLayoutStyle(state) {
  return React.useMemo(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const style = {};
    const theme = runtime.config.theme2;
    style.display = "grid";
    style.gridTemplateColumns = state.templateColumns;
    style.gridTemplateRows = state.templateRows || "unset";
    style.gridAutoRows = state.autoRows || "unset";
    style.rowGap = theme.spacing((_a = state.rowGap) != null ? _a : 1);
    style.columnGap = theme.spacing((_b = state.columnGap) != null ? _b : 1);
    style.justifyItems = state.justifyItems || "unset";
    style.alignItems = state.alignItems || "unset";
    style.justifyContent = state.justifyContent || "unset";
    style.flexGrow = 1;
    if (state.md) {
      style[theme.breakpoints.down("md")] = {
        gridTemplateRows: (_c = state.md) == null ? void 0 : _c.templateRows,
        gridTemplateColumns: (_d = state.md) == null ? void 0 : _d.templateColumns,
        rowGap: state.md.rowGap ? theme.spacing((_f = (_e = state.md) == null ? void 0 : _e.rowGap) != null ? _f : 1) : void 0,
        columnGap: state.md.columnGap ? theme.spacing((_h = (_g = state.md) == null ? void 0 : _g.rowGap) != null ? _h : 1) : void 0,
        justifyItems: (_i = state.md) == null ? void 0 : _i.justifyItems,
        alignItems: (_j = state.md) == null ? void 0 : _j.alignItems,
        justifyContent: (_k = state.md) == null ? void 0 : _k.justifyContent
      };
    }
    return css.css(style);
  }, [state]);
}
function useItemStyle(state) {
  return React.useMemo(() => {
    const style = {};
    style.gridColumn = state.gridColumn || "unset";
    style.gridRow = state.gridRow || "unset";
    style.position = "relative";
    return css.css(style);
  }, [state]);
}

var __defProp$3 = Object.defineProperty;
var __getOwnPropSymbols$3 = Object.getOwnPropertySymbols;
var __hasOwnProp$3 = Object.prototype.hasOwnProperty;
var __propIsEnum$3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$3 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$3.call(b, prop))
      __defNormalProp$3(a, prop, b[prop]);
  if (__getOwnPropSymbols$3)
    for (var prop of __getOwnPropSymbols$3(b)) {
      if (__propIsEnum$3.call(b, prop))
        __defNormalProp$3(a, prop, b[prop]);
    }
  return a;
};
const PIXELS_PER_MS = 0.3;
const VERTICAL_KEYS = /* @__PURE__ */ new Set(["ArrowUp", "ArrowDown"]);
const HORIZONTAL_KEYS = /* @__PURE__ */ new Set(["ArrowLeft", "ArrowRight"]);
const propsForDirection = {
  row: {
    dim: "width",
    axis: "clientX",
    min: "minWidth",
    max: "maxWidth"
  },
  column: {
    dim: "height",
    axis: "clientY",
    min: "minHeight",
    max: "maxHeight"
  }
};
function Splitter({
  direction = "row",
  handleSize = 32,
  initialSize = "auto",
  primaryPaneStyles,
  secondaryPaneStyles,
  onDragFinished,
  children
}) {
  const kids = React__default["default"].Children.toArray(children);
  const splitterRef = React.useRef(null);
  const firstPaneRef = React.useRef(null);
  const secondPaneRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const containerSize = React.useRef(null);
  const primarySizeRef = React.useRef("1fr");
  const firstPaneMeasurements = React.useRef(void 0);
  const savedPos = React.useRef(void 0);
  const measurementProp = propsForDirection[direction].dim;
  const clientAxis = propsForDirection[direction].axis;
  const minDimProp = propsForDirection[direction].min;
  const maxDimProp = propsForDirection[direction].max;
  useResizeObserver(
    containerRef.current,
    (entries) => {
      for (const entry of entries) {
        if (!entry.target.isSameNode(containerRef.current)) {
          return;
        }
        const curSize = firstPaneRef.current.getBoundingClientRect()[measurementProp];
        const newDims = measureElement(firstPaneRef.current);
        splitterRef.current.ariaValueNow = `${lodash.clamp(
          (curSize - newDims[minDimProp]) / (newDims[maxDimProp] - newDims[minDimProp]) * 100,
          0,
          100
        )}`;
      }
    },
    500,
    [maxDimProp, minDimProp, direction, measurementProp]
  );
  const dragStart = React.useRef(null);
  const onPointerDown = React.useCallback(
    (e) => {
      primarySizeRef.current = firstPaneRef.current.getBoundingClientRect()[measurementProp];
      containerSize.current = containerRef.current.getBoundingClientRect()[measurementProp];
      dragStart.current = e[clientAxis];
      splitterRef.current.setPointerCapture(e.pointerId);
      firstPaneMeasurements.current = measureElement(firstPaneRef.current);
      savedPos.current = void 0;
    },
    [measurementProp, clientAxis]
  );
  const onPointerMove = React.useCallback(
    (e) => {
      if (dragStart.current !== null && primarySizeRef.current !== "1fr") {
        const diff = e[clientAxis] - dragStart.current;
        const dims = firstPaneMeasurements.current;
        const newSize = lodash.clamp(primarySizeRef.current + diff, dims[minDimProp], dims[maxDimProp]);
        const newFlex = newSize / (containerSize.current - handleSize);
        firstPaneRef.current.style.flexGrow = `${newFlex}`;
        secondPaneRef.current.style.flexGrow = `${1 - newFlex}`;
        const ariaValueNow = lodash.clamp(
          (newSize - dims[minDimProp]) / (dims[maxDimProp] - dims[minDimProp]) * 100,
          0,
          100
        );
        splitterRef.current.ariaValueNow = `${ariaValueNow}`;
      }
    },
    [handleSize, clientAxis, minDimProp, maxDimProp]
  );
  const onPointerUp = React.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      splitterRef.current.releasePointerCapture(e.pointerId);
      dragStart.current = null;
      onDragFinished == null ? void 0 : onDragFinished(parseFloat(firstPaneRef.current.style.flexGrow));
    },
    [onDragFinished]
  );
  const pressedKeys = React.useRef(/* @__PURE__ */ new Set());
  const keysLastHandledAt = React.useRef(null);
  const handlePressedKeys = React.useCallback(
    (time) => {
      var _a;
      const nothingPressed = pressedKeys.current.size === 0;
      if (nothingPressed) {
        keysLastHandledAt.current = null;
        return;
      } else if (primarySizeRef.current === "1fr") {
        return;
      }
      const dt = time - ((_a = keysLastHandledAt.current) != null ? _a : time);
      const dx = dt * PIXELS_PER_MS;
      let sizeChange = 0;
      if (direction === "row") {
        if (pressedKeys.current.has("ArrowLeft")) {
          sizeChange -= dx;
        }
        if (pressedKeys.current.has("ArrowRight")) {
          sizeChange += dx;
        }
      } else {
        if (pressedKeys.current.has("ArrowUp")) {
          sizeChange -= dx;
        }
        if (pressedKeys.current.has("ArrowDown")) {
          sizeChange += dx;
        }
      }
      const firstPaneDims = firstPaneMeasurements.current;
      const curSize = firstPaneRef.current.getBoundingClientRect()[measurementProp];
      const newSize = lodash.clamp(curSize + sizeChange, firstPaneDims[minDimProp], firstPaneDims[maxDimProp]);
      const newFlex = newSize / (containerSize.current - handleSize);
      firstPaneRef.current.style.flexGrow = `${newFlex}`;
      secondPaneRef.current.style.flexGrow = `${1 - newFlex}`;
      const ariaValueNow = (newSize - firstPaneDims[minDimProp]) / (firstPaneDims[maxDimProp] - firstPaneDims[minDimProp]) * 100;
      splitterRef.current.ariaValueNow = `${lodash.clamp(ariaValueNow, 0, 100)}`;
      keysLastHandledAt.current = time;
      window.requestAnimationFrame(handlePressedKeys);
    },
    [direction, handleSize, minDimProp, maxDimProp, measurementProp]
  );
  const onKeyDown = React.useCallback(
    (e) => {
      if (e.key === "Enter") {
        if (savedPos.current === void 0) {
          savedPos.current = firstPaneRef.current.style.flexGrow;
          firstPaneRef.current.style.flexGrow = "0";
          secondPaneRef.current.style.flexGrow = "1";
        } else {
          firstPaneRef.current.style.flexGrow = savedPos.current;
          secondPaneRef.current.style.flexGrow = `${1 - parseFloat(savedPos.current)}`;
          savedPos.current = void 0;
        }
        return;
      } else if (e.key === "Home") {
        firstPaneMeasurements.current = measureElement(firstPaneRef.current);
        containerSize.current = containerRef.current.getBoundingClientRect()[measurementProp];
        const newFlex = firstPaneMeasurements.current[minDimProp] / (containerSize.current - handleSize);
        firstPaneRef.current.style.flexGrow = `${newFlex}`;
        secondPaneRef.current.style.flexGrow = `${1 - newFlex}`;
        splitterRef.current.ariaValueNow = "0";
        return;
      } else if (e.key === "End") {
        firstPaneMeasurements.current = measureElement(firstPaneRef.current);
        containerSize.current = containerRef.current.getBoundingClientRect()[measurementProp];
        const newFlex = firstPaneMeasurements.current[maxDimProp] / (containerSize.current - handleSize);
        firstPaneRef.current.style.flexGrow = `${newFlex}`;
        secondPaneRef.current.style.flexGrow = `${1 - newFlex}`;
        splitterRef.current.ariaValueNow = "100";
        return;
      }
      if (!(direction === "column" && VERTICAL_KEYS.has(e.key) || direction === "row" && HORIZONTAL_KEYS.has(e.key)) || pressedKeys.current.has(e.key)) {
        return;
      }
      savedPos.current = void 0;
      e.preventDefault();
      e.stopPropagation();
      primarySizeRef.current = firstPaneRef.current.getBoundingClientRect()[measurementProp];
      containerSize.current = containerRef.current.getBoundingClientRect()[measurementProp];
      firstPaneMeasurements.current = measureElement(firstPaneRef.current);
      const newKey = !pressedKeys.current.has(e.key);
      if (newKey) {
        const initiateAnimationLoop = pressedKeys.current.size === 0;
        pressedKeys.current.add(e.key);
        if (initiateAnimationLoop) {
          window.requestAnimationFrame(handlePressedKeys);
        }
      }
    },
    [direction, handlePressedKeys, handleSize, maxDimProp, measurementProp, minDimProp]
  );
  const onKeyUp = React.useCallback(
    (e) => {
      if (direction === "row" && !HORIZONTAL_KEYS.has(e.key) || direction === "column" && !VERTICAL_KEYS.has(e.key)) {
        return;
      }
      pressedKeys.current.delete(e.key);
      onDragFinished == null ? void 0 : onDragFinished(parseFloat(firstPaneRef.current.style.flexGrow));
    },
    [direction, onDragFinished]
  );
  const onDoubleClick = React.useCallback(() => {
    firstPaneRef.current.style.flexGrow = "0.5";
    secondPaneRef.current.style.flexGrow = "0.5";
    const dim = measureElement(firstPaneRef.current);
    firstPaneMeasurements.current = dim;
    primarySizeRef.current = firstPaneRef.current.getBoundingClientRect()[measurementProp];
    splitterRef.current.ariaValueNow = `${(primarySizeRef.current - dim[minDimProp]) / (dim[maxDimProp] - dim[minDimProp]) * 100}`;
  }, [maxDimProp, measurementProp, minDimProp]);
  const onBlur = React.useCallback(() => {
    if (pressedKeys.current.size > 0) {
      pressedKeys.current.clear();
      dragStart.current = null;
      onDragFinished == null ? void 0 : onDragFinished(parseFloat(firstPaneRef.current.style.flexGrow));
    }
  }, [onDragFinished]);
  const styles = ui.useStyles2(getStyles$3);
  const id = useUniqueId();
  const secondAvailable = kids.length === 2;
  const visibilitySecond = secondAvailable ? "visible" : "hidden";
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    ref: containerRef,
    className: styles.container,
    style: {
      flexDirection: direction
    }
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    ref: firstPaneRef,
    className: styles.panel,
    style: __spreadValues$3({
      flexGrow: initialSize === "auto" ? 0.5 : lodash.clamp(initialSize, 0, 1),
      [minDimProp]: "min-content"
    }, primaryPaneStyles),
    id: `start-panel-${id}`
  }, kids[0]), kids[1] && /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, /* @__PURE__ */ React__default["default"].createElement("div", {
    ref: splitterRef,
    style: { [measurementProp]: `${handleSize}px` },
    className: css.cx(styles.handle, { [styles.handleHorizontal]: direction === "column" }),
    onPointerUp,
    onPointerDown,
    onPointerMove,
    onKeyDown,
    onKeyUp,
    onDoubleClick,
    onBlur,
    role: "separator",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": 50,
    "aria-controls": `start-panel-${id}`,
    "aria-label": "Pane resize widget",
    tabIndex: 0
  }), /* @__PURE__ */ React__default["default"].createElement("div", {
    ref: secondPaneRef,
    className: styles.panel,
    style: __spreadValues$3({
      flexGrow: initialSize === "auto" ? 0.5 : lodash.clamp(1 - initialSize, 0, 1),
      [minDimProp]: "min-content",
      visibility: `${visibilitySecond}`
    }, secondaryPaneStyles),
    id: `end-panel-${id}`
  }, kids[1])));
}
function getStyles$3(theme) {
  return {
    handle: css.css({
      cursor: "col-resize",
      position: "relative",
      flexShrink: 0,
      userSelect: "none",
      "&::before": {
        content: '""',
        position: "absolute",
        backgroundColor: theme.colors.primary.main,
        left: "50%",
        transform: "translate(-50%)",
        top: 0,
        height: "100%",
        width: "1px",
        opacity: 0,
        transition: "opacity ease-in-out 0.2s"
      },
      "&::after": {
        content: '""',
        width: "4px",
        borderRadius: "4px",
        backgroundColor: theme.colors.border.weak,
        transition: "background-color ease-in-out 0.2s",
        height: "50%",
        top: "calc(50% - (50%) / 2)",
        transform: "translateX(-50%)",
        position: "absolute",
        left: "50%"
      },
      "&:hover, &:focus-visible": {
        outline: "none",
        "&::before": {
          opacity: 1
        },
        "&::after": {
          backgroundColor: theme.colors.primary.main
        }
      }
    }),
    handleHorizontal: css.css({
      cursor: "row-resize",
      "&::before": {
        left: "inherit",
        transform: "translateY(-50%)",
        top: "50%",
        height: "1px",
        width: "100%"
      },
      "&::after": {
        width: "50%",
        height: "4px",
        top: "50%",
        transform: "translateY(-50%)",
        left: "calc(50% - (50%) / 2)"
      }
    }),
    container: css.css({
      display: "flex",
      width: "100%",
      flexGrow: 1,
      overflow: "hidden"
    }),
    panel: css.css({ display: "flex", position: "relative", flexBasis: 0 })
  };
}
function measureElement(ref) {
  if (ref === null) {
    return void 0;
  }
  const savedBodyOverflow = document.body.style.overflow;
  const savedWidth = ref.style.width;
  const savedHeight = ref.style.height;
  const savedFlex = ref.style.flexGrow;
  document.body.style.overflow = "hidden";
  ref.style.flexGrow = "0";
  const { width: minWidth, height: minHeight } = ref.getBoundingClientRect();
  ref.style.flexGrow = "100";
  const { width: maxWidth, height: maxHeight } = ref.getBoundingClientRect();
  document.body.style.overflow = savedBodyOverflow;
  ref.style.width = savedWidth;
  ref.style.height = savedHeight;
  ref.style.flexGrow = savedFlex;
  return { minWidth, maxWidth, minHeight, maxHeight };
}
function useResizeObserver(target, cb, throttleWait = 0, deps) {
  const throttledCallback = lodash.throttle(cb, throttleWait);
  React.useLayoutEffect(() => {
    if (!target) {
      return;
    }
    const resizeObserver = new ResizeObserver(throttledCallback);
    resizeObserver.observe(target, { box: "device-pixel-content-box" });
    return () => resizeObserver.disconnect();
  }, deps);
}

function SplitLayoutRenderer({ model }) {
  const { primary, secondary, direction, isHidden, initialSize, primaryPaneStyles, secondaryPaneStyles } = model.useState();
  if (isHidden) {
    return null;
  }
  const Prim = primary.Component;
  const Sec = secondary == null ? void 0 : secondary.Component;
  let startSize = secondary ? initialSize : 1;
  return /* @__PURE__ */ React__default["default"].createElement(Splitter, {
    direction,
    initialSize: startSize != null ? startSize : 0.5,
    primaryPaneStyles,
    secondaryPaneStyles
  }, /* @__PURE__ */ React__default["default"].createElement(Prim, {
    key: primary.state.key,
    model: primary,
    parentState: model.state
  }), Sec && secondary && /* @__PURE__ */ React__default["default"].createElement(Sec, {
    key: secondary.state.key,
    model: secondary,
    parentState: model.state
  }));
}

class SplitLayout extends SceneObjectBase {
  toggleDirection() {
    this.setState({
      direction: this.state.direction === "row" ? "column" : "row"
    });
  }
  isDraggable() {
    return false;
  }
}
SplitLayout.Component = SplitLayoutRenderer;

class SceneApp extends SceneObjectBase {
  enrichDataRequest() {
    return {
      app: this.state.name || "app"
    };
  }
}
SceneApp.Component = ({ model }) => {
  const { pages } = model.useState();
  return /* @__PURE__ */ React__default["default"].createElement(SceneAppContext.Provider, {
    value: model
  }, /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Switch, null, pages.map((page) => /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Route, {
    key: page.state.url,
    exact: false,
    path: page.state.url,
    render: (props) => renderSceneComponentWithRouteProps(page, props)
  }))));
};
const SceneAppContext = React.createContext(null);
const sceneAppCache = /* @__PURE__ */ new Map();
function useSceneApp(factory) {
  const cachedApp = sceneAppCache.get(factory);
  if (cachedApp) {
    return cachedApp;
  }
  const newApp = factory();
  sceneAppCache.set(factory, newApp);
  return newApp;
}

var __defProp$2 = Object.defineProperty;
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$2.call(b, prop))
      __defNormalProp$2(a, prop, b[prop]);
  if (__getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(b)) {
      if (__propIsEnum$2.call(b, prop))
        __defNormalProp$2(a, prop, b[prop]);
    }
  return a;
};
class SceneReactObject extends SceneObjectBase {
}
SceneReactObject.Component = ({ model }) => {
  const { component: Component, props, reactNode } = model.useState();
  if (Component) {
    return /* @__PURE__ */ React__default["default"].createElement(Component, __spreadValues$2({}, props));
  }
  if (reactNode) {
    return reactNode;
  }
  return null;
};

function DebugDetails({ node }) {
  const state = node.useState();
  const styles = ui.useStyles2(getStyles$2);
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.container
  }, Object.keys(state).map((key) => /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.row,
    key
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.keyName
  }, key), /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.value
  }, renderValue(key, state[key], node)))));
}
function renderValue(key, value, node) {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "number":
      return /* @__PURE__ */ React__default["default"].createElement(ui.Input, {
        type: "number",
        defaultValue: value,
        onBlur: (evt) => node.setState({ [key]: evt.currentTarget.valueAsNumber })
      });
    case "string":
      return /* @__PURE__ */ React__default["default"].createElement(ui.Input, {
        type: "text",
        defaultValue: value,
        onBlur: (evt) => node.setState({ [key]: evt.currentTarget.value })
      });
    case "object":
      if (isSceneObject(value)) {
        return value.constructor.name;
      }
      if (lodash.isPlainObject(value) || lodash.isArray(value)) {
        return /* @__PURE__ */ React__default["default"].createElement(ui.JSONFormatter, {
          json: value,
          open: 0
        });
      }
      return String(value);
    default:
      return typeof value;
  }
}
function getStyles$2(theme) {
  return {
    container: css.css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(0.5),
      flexDirection: "column"
    }),
    row: css.css({
      display: "flex",
      gap: theme.spacing(2)
    }),
    keyName: css.css({
      display: "flex",
      flexGrow: "0",
      width: 120,
      alignItems: "center",
      height: theme.spacing(theme.components.height.md)
    }),
    value: css.css({
      flexGrow: 1,
      minHeight: theme.spacing(theme.components.height.md),
      display: "flex",
      alignItems: "center"
    })
  };
}

function DebugTreeNode({ node, selectedObject, onSelect }) {
  const styles = ui.useStyles2(getStyles$1);
  const children = [];
  const isSelected = node === selectedObject;
  node.forEachChild((child) => {
    children.push(
      /* @__PURE__ */ React__default["default"].createElement(DebugTreeNode, {
        node: child,
        key: child.state.key,
        selectedObject,
        onSelect
      })
    );
  });
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.container
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: css.cx(styles.name, isSelected && styles.selected),
    onClick: () => onSelect(node)
  }, node.constructor.name), /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.children
  }, children));
}
function getStyles$1(theme) {
  return {
    container: css.css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(0.5),
      flexDirection: "column"
    }),
    name: css.css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(1),
      fontSize: theme.typography.bodySmall.fontSize,
      cursor: "pointer",
      padding: theme.spacing(0, 1),
      borderRadius: theme.shape.borderRadius(2),
      position: "relative",
      "&:hover": {
        background: theme.colors.background.secondary
      }
    }),
    selected: css.css({
      "&::before": {
        display: "block",
        content: "' '",
        position: "absolute",
        left: 0,
        width: 4,
        bottom: 2,
        top: 2,
        borderRadius: theme.shape.radius.default,
        backgroundImage: theme.colors.gradients.brandVertical
      }
    }),
    children: css.css({
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      paddingLeft: theme.spacing(1)
    })
  };
}

function SceneDebugger({ scene }) {
  const styles = ui.useStyles2(getStyles);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedObject, setSelectedObject] = React.useState();
  return /* @__PURE__ */ React__default["default"].createElement(React__default["default"].Fragment, null, /* @__PURE__ */ React__default["default"].createElement(ui.ToolbarButton, {
    variant: "canvas",
    icon: "bug",
    onClick: () => setIsOpen(true)
  }), isOpen && /* @__PURE__ */ React__default["default"].createElement(ui.Drawer, {
    title: "Scene debugger",
    onClose: () => setIsOpen(false),
    size: "lg"
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.panes
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.pane1
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.paneHeading
  }, "Scene graph"), /* @__PURE__ */ React__default["default"].createElement(ui.CustomScrollbar, {
    autoHeightMin: "100%"
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.treeWrapper
  }, /* @__PURE__ */ React__default["default"].createElement(DebugTreeNode, {
    node: scene,
    selectedObject,
    onSelect: setSelectedObject
  })))), /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.pane2
  }, /* @__PURE__ */ React__default["default"].createElement("div", {
    className: styles.paneHeading
  }, "Object details"), selectedObject && /* @__PURE__ */ React__default["default"].createElement(DebugDetails, {
    node: selectedObject
  })))));
}
function getStyles(theme) {
  return {
    panes: css.css({
      flexGrow: 1,
      display: "flex",
      height: "100%",
      flexDirection: "row",
      marginTop: theme.spacing(-2)
    }),
    pane1: css.css({
      flexGrow: 0,
      display: "flex",
      height: "100%",
      flexDirection: "column",
      borderRight: `1px solid ${theme.colors.border.weak}`
    }),
    pane2: css.css({
      flexGrow: 1,
      display: "flex",
      minHeight: "100%",
      flexDirection: "column",
      paddingLeft: theme.spacing(2)
    }),
    treeWrapper: css.css({
      paddingRight: theme.spacing(2),
      height: "100%",
      marginLeft: theme.spacing(-1)
    }),
    paneHeading: css.css({
      padding: theme.spacing(1, 0),
      fontWeight: theme.typography.fontWeightMedium
    })
  };
}

function SceneAppPageView({ page, routeProps }) {
  const containerPage = getParentPageIfTab(page);
  const containerState = containerPage.useState();
  const params = useAppQueryParams();
  const scene = page.getScene(routeProps.match);
  const appContext = React.useContext(SceneAppContext);
  const isInitialized = containerState.initializedScene === scene;
  const { layout } = page.state;
  const locationService = useLocationServiceSafe();
  React.useLayoutEffect(() => {
    if (!isInitialized) {
      containerPage.initializeScene(scene);
    }
  }, [scene, containerPage, isInitialized]);
  React.useEffect(() => {
    return () => containerPage.setState({ initializedScene: void 0 });
  }, [containerPage]);
  const urlSyncInitialized = useUrlSync(containerPage, appContext == null ? void 0 : appContext.state.urlSyncOptions);
  if (!isInitialized && !urlSyncInitialized) {
    return null;
  }
  const pageNav = {
    text: containerState.title,
    img: containerState.titleImg,
    icon: containerState.titleIcon,
    url: getUrlWithAppState(containerState.url, locationService.getSearchObject(), containerState.preserveUrlKeys),
    hideFromBreadcrumbs: containerState.hideFromBreadcrumbs,
    parentItem: getParentBreadcrumbs(
      containerState.getParentPage ? containerState.getParentPage() : containerPage.parent,
      params,
      locationService.getSearchObject()
    )
  };
  if (containerState.tabs) {
    pageNav.children = containerState.tabs.map((tab) => {
      return {
        text: tab.state.title,
        icon: tab.state.titleIcon,
        tabSuffix: tab.state.tabSuffix,
        active: page === tab,
        url: getUrlWithAppState(tab.state.url, locationService.getSearchObject(), tab.state.preserveUrlKeys),
        parentItem: pageNav
      };
    });
  }
  let pageActions = [];
  if (containerState.controls) {
    pageActions = containerState.controls.map((control) => /* @__PURE__ */ React__default["default"].createElement(control.Component, {
      model: control,
      key: control.state.key
    }));
  }
  if (params["scene-debugger"]) {
    pageActions.push(/* @__PURE__ */ React__default["default"].createElement(SceneDebugger, {
      scene: containerPage,
      key: "scene-debugger"
    }));
  }
  return /* @__PURE__ */ React__default["default"].createElement(runtime.PluginPage, {
    layout,
    pageNav,
    actions: pageActions,
    renderTitle: containerState.renderTitle,
    subTitle: containerState.subTitle
  }, /* @__PURE__ */ React__default["default"].createElement(scene.Component, {
    model: scene
  }));
}
function getParentPageIfTab(page) {
  if (page.parent instanceof SceneAppPage) {
    return page.parent;
  }
  return page;
}
function getParentBreadcrumbs(parent, params, searchObject) {
  if (parent instanceof SceneAppPage) {
    return {
      text: parent.state.title,
      url: getUrlWithAppState(parent.state.url, searchObject, parent.state.preserveUrlKeys),
      hideFromBreadcrumbs: parent.state.hideFromBreadcrumbs,
      parentItem: getParentBreadcrumbs(
        parent.state.getParentPage ? parent.state.getParentPage() : parent.parent,
        params,
        searchObject
      )
    };
  }
  return void 0;
}
function SceneAppDrilldownViewRender({ drilldown, parent, routeProps }) {
  return renderSceneComponentWithRouteProps(parent.getDrilldownPage(drilldown, routeProps.match), routeProps);
}

class SceneAppPage extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._sceneCache = /* @__PURE__ */ new Map();
    this._drilldownCache = /* @__PURE__ */ new Map();
  }
  initializeScene(scene) {
    this.setState({ initializedScene: scene });
  }
  getScene(routeMatch) {
    let scene = this._sceneCache.get(routeMatch.url);
    if (scene) {
      return scene;
    }
    if (!this.state.getScene) {
      throw new Error("Missing getScene on SceneAppPage " + this.state.title);
    }
    scene = this.state.getScene(routeMatch);
    this._sceneCache.set(routeMatch.url, scene);
    return scene;
  }
  getDrilldownPage(drilldown, routeMatch) {
    let page = this._drilldownCache.get(routeMatch.url);
    if (page) {
      return page;
    }
    page = drilldown.getPage(routeMatch, this);
    this._drilldownCache.set(routeMatch.url, page);
    return page;
  }
  enrichDataRequest(source) {
    if (this.state.getParentPage) {
      return this.state.getParentPage().enrichDataRequest(source);
    }
    if (!this.parent) {
      return null;
    }
    const root = this.getRoot();
    if (isDataRequestEnricher(root)) {
      return root.enrichDataRequest(source);
    }
    return null;
  }
}
SceneAppPage.Component = SceneAppPageRenderer;
function SceneAppPageRenderer({ model, routeProps }) {
  var _a, _b;
  const { tabs, drilldowns } = model.useState();
  const routes = [];
  if (tabs && tabs.length > 0) {
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      const tab = tabs[tabIndex];
      if (tabIndex === 0) {
        routes.push(
          /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Route, {
            exact: true,
            key: model.state.url,
            path: (_a = model.state.routePath) != null ? _a : model.state.url,
            render: (props) => renderSceneComponentWithRouteProps(tab, props)
          })
        );
      }
      routes.push(
        /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Route, {
          exact: true,
          key: tab.state.url,
          path: (_b = tab.state.routePath) != null ? _b : tab.state.url,
          render: (props) => renderSceneComponentWithRouteProps(tab, props)
        })
      );
      if (tab.state.drilldowns) {
        for (const drilldown of tab.state.drilldowns) {
          routes.push(
            /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Route, {
              exact: false,
              key: drilldown.routePath,
              path: drilldown.routePath,
              render: (props) => /* @__PURE__ */ React__default["default"].createElement(SceneAppDrilldownViewRender, {
                drilldown,
                parent: tab,
                routeProps: props
              })
            })
          );
        }
      }
    }
  }
  if (drilldowns) {
    for (const drilldown of drilldowns) {
      routes.push(
        /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Route, {
          key: drilldown.routePath,
          exact: false,
          path: drilldown.routePath,
          render: (props) => /* @__PURE__ */ React__default["default"].createElement(SceneAppDrilldownViewRender, {
            drilldown,
            parent: model,
            routeProps: props
          })
        })
      );
    }
  }
  if (!tabs && isCurrentPageRouteMatch(model, routeProps.match)) {
    return /* @__PURE__ */ React__default["default"].createElement(SceneAppPageView, {
      page: model,
      routeProps
    });
  }
  routes.push(getFallbackRoute(model, routeProps));
  return /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Switch, null, routes);
}
function getFallbackRoute(page, routeProps) {
  return /* @__PURE__ */ React__default["default"].createElement(reactRouterDom.Route, {
    key: "fallback route",
    render: (props) => {
      var _a, _b, _c;
      const fallbackPage = (_c = (_b = (_a = page.state).getFallbackPage) == null ? void 0 : _b.call(_a)) != null ? _c : getDefaultFallbackPage();
      return /* @__PURE__ */ React__default["default"].createElement(SceneAppPageView, {
        page: fallbackPage,
        routeProps
      });
    }
  });
}
function isCurrentPageRouteMatch(page, match) {
  if (!match.isExact) {
    return false;
  }
  if (match.url === page.state.url) {
    return true;
  }
  if (page.parent instanceof SceneAppPage && page.parent.state.tabs[0] === page && page.parent.state.url === match.url) {
    return true;
  }
  return false;
}
function getDefaultFallbackPage() {
  return new SceneAppPage({
    url: "",
    title: "Not found",
    subTitle: "The url did not match any page",
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          direction: "column",
          children: [
            new SceneFlexItem({
              body: new SceneReactObject({
                component: () => {
                  return /* @__PURE__ */ React__default["default"].createElement("div", {
                    "data-testid": "default-fallback-content"
                  }, "If you found your way here using a link then there might be a bug in this application.");
                }
              })
            })
          ]
        })
      });
    }
  });
}

class StandardFieldConfigOverridesBuilder {
  constructor() {
    this._overrides = [];
  }
  overrideColor(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "color", value });
    return this;
  }
  overrideDecimals(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "decimals", value });
    return this;
  }
  overrideDisplayName(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "displayName", value });
    return this;
  }
  overrideFilterable(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "filterable", value });
    return this;
  }
  overrideLinks(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "links", value });
    return this;
  }
  overrideMappings(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "mappings", value });
    return this;
  }
  overrideMax(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "max", value });
    return this;
  }
  overrideMin(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "min", value });
    return this;
  }
  overrideNoValue(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "noValue", value });
    return this;
  }
  overrideThresholds(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "thresholds", value });
    return this;
  }
  overrideUnit(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "unit", value });
    return this;
  }
}

class FieldConfigOverridesBuilder extends StandardFieldConfigOverridesBuilder {
  match(matcher) {
    this._overrides.push({ matcher, properties: [] });
    return this;
  }
  matchFieldsWithName(name) {
    this._overrides.push({
      matcher: {
        id: data.FieldMatcherID.byName,
        options: name
      },
      properties: []
    });
    return this;
  }
  matchFieldsWithNameByRegex(regex) {
    this._overrides.push({
      matcher: {
        id: data.FieldMatcherID.byRegexp,
        options: regex
      },
      properties: []
    });
    return this;
  }
  matchFieldsByType(fieldType) {
    this._overrides.push({
      matcher: {
        id: data.FieldMatcherID.byType,
        options: fieldType
      },
      properties: []
    });
    return this;
  }
  matchFieldsByQuery(refId) {
    this._overrides.push({
      matcher: {
        id: data.FieldMatcherID.byFrameRefID,
        options: refId
      },
      properties: []
    });
    return this;
  }
  matchFieldsByValue(options) {
    this._overrides.push({
      matcher: {
        id: data.FieldMatcherID.byValue,
        options
      },
      properties: []
    });
    return this;
  }
  matchComparisonQuery(refId) {
    return this.matchFieldsByQuery(getCompareSeriesRefId(refId));
  }
  overrideCustomFieldConfig(id, value) {
    const _id = `custom.${String(id)}`;
    const last = this._overrides[this._overrides.length - 1];
    last.properties.push({ id: _id, value });
    return this;
  }
  build() {
    return this._overrides;
  }
}

var __defProp$1 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$1.call(b, prop))
      __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b)) {
      if (__propIsEnum$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
class FieldConfigBuilder {
  constructor(defaultFieldConfig) {
    this.defaultFieldConfig = defaultFieldConfig;
    this._fieldConfig = {
      defaults: {},
      overrides: []
    };
    this._overridesBuilder = new FieldConfigOverridesBuilder();
    this.setDefaults();
  }
  setDefaults() {
    const fieldConfig = {
      defaults: {
        custom: this.defaultFieldConfig ? lodash.cloneDeep(this.defaultFieldConfig()) : {}
      },
      overrides: []
    };
    this._fieldConfig = fieldConfig;
  }
  setColor(color) {
    return this.setFieldConfigDefaults("color", color);
  }
  setDecimals(decimals) {
    return this.setFieldConfigDefaults("decimals", decimals);
  }
  setDisplayName(displayName) {
    return this.setFieldConfigDefaults("displayName", displayName);
  }
  setFilterable(filterable) {
    return this.setFieldConfigDefaults("filterable", filterable);
  }
  setLinks(links) {
    return this.setFieldConfigDefaults("links", links);
  }
  setMappings(mappings) {
    return this.setFieldConfigDefaults("mappings", mappings);
  }
  setMax(max) {
    return this.setFieldConfigDefaults("max", max);
  }
  setMin(min) {
    return this.setFieldConfigDefaults("min", min);
  }
  setNoValue(noValue) {
    return this.setFieldConfigDefaults("noValue", noValue);
  }
  setThresholds(thresholds) {
    return this.setFieldConfigDefaults("thresholds", thresholds);
  }
  setUnit(unit) {
    return this.setFieldConfigDefaults("unit", unit);
  }
  setCustomFieldConfig(id, value) {
    this._fieldConfig.defaults = __spreadProps$1(__spreadValues$1({}, this._fieldConfig.defaults), {
      custom: lodash.merge(this._fieldConfig.defaults.custom, { [id]: value })
    });
    return this;
  }
  setOverrides(builder) {
    builder(this._overridesBuilder);
    return this;
  }
  setFieldConfigDefaults(key, value) {
    this._fieldConfig.defaults = __spreadProps$1(__spreadValues$1({}, this._fieldConfig.defaults), {
      [key]: value
    });
    return this;
  }
  build() {
    return {
      defaults: this._fieldConfig.defaults,
      overrides: this._overridesBuilder.build()
    };
  }
}

class PanelOptionsBuilder {
  constructor(defaultOptions) {
    this.defaultOptions = defaultOptions;
    this._options = {};
    this.setDefaults();
  }
  setDefaults() {
    this._options = this.defaultOptions ? lodash.cloneDeep(this.defaultOptions()) : {};
  }
  setOption(id, value) {
    this._options = lodash.merge(this._options, { [id]: value });
    return this;
  }
  build() {
    return this._options;
  }
}

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
class VizPanelBuilder {
  constructor(pluginId, pluginVersion, defaultOptions, defaultFieldConfig) {
    this._state = {};
    this._state.title = "";
    this._state.description = "";
    this._state.displayMode = "default";
    this._state.hoverHeader = false;
    this._state.pluginId = pluginId;
    this._state.pluginVersion = pluginVersion;
    this._fieldConfigBuilder = new FieldConfigBuilder(defaultFieldConfig);
    this._panelOptionsBuilder = new PanelOptionsBuilder(defaultOptions);
  }
  setTitle(title) {
    this._state.title = title;
    return this;
  }
  setDescription(description) {
    this._state.description = description;
    return this;
  }
  setDisplayMode(displayMode) {
    this._state.displayMode = displayMode;
    return this;
  }
  setHoverHeader(hoverHeader) {
    this._state.hoverHeader = hoverHeader;
    return this;
  }
  setShowMenuAlways(showMenuAlways) {
    this._state.showMenuAlways = showMenuAlways;
    return this;
  }
  setMenu(menu) {
    this._state.menu = menu;
    return this;
  }
  setHeaderActions(headerActions) {
    this._state.headerActions = headerActions;
    return this;
  }
  setCollapsible(collapsible) {
    this._state.collapsible = collapsible;
    return this;
  }
  setCollapsed(collapsed) {
    this._state.collapsed = collapsed;
    return this;
  }
  setColor(color) {
    this._fieldConfigBuilder.setColor(color);
    return this;
  }
  setDecimals(decimals) {
    this._fieldConfigBuilder.setDecimals(decimals);
    return this;
  }
  setDisplayName(displayName) {
    this._fieldConfigBuilder.setDisplayName(displayName);
    return this;
  }
  setFilterable(filterable) {
    this._fieldConfigBuilder.setFilterable(filterable);
    return this;
  }
  setLinks(links) {
    this._fieldConfigBuilder.setLinks(links);
    return this;
  }
  setMappings(mappings) {
    this._fieldConfigBuilder.setMappings(mappings);
    return this;
  }
  setMax(max) {
    this._fieldConfigBuilder.setMax(max);
    return this;
  }
  setMin(min) {
    this._fieldConfigBuilder.setMin(min);
    return this;
  }
  setNoValue(noValue) {
    this._fieldConfigBuilder.setNoValue(noValue);
    return this;
  }
  setThresholds(thresholds) {
    this._fieldConfigBuilder.setThresholds(thresholds);
    return this;
  }
  setUnit(unit) {
    this._fieldConfigBuilder.setUnit(unit);
    return this;
  }
  setCustomFieldConfig(id, value) {
    this._fieldConfigBuilder.setCustomFieldConfig(id, value);
    return this;
  }
  setOverrides(builder) {
    this._fieldConfigBuilder.setOverrides(builder);
    return this;
  }
  setOption(id, value) {
    this._panelOptionsBuilder.setOption(id, value);
    return this;
  }
  setData(data) {
    this._state.$data = data;
    return this;
  }
  setTimeRange(timeRange) {
    this._state.$timeRange = timeRange;
    return this;
  }
  setVariables(variables) {
    this._state.$variables = variables;
    return this;
  }
  setBehaviors(behaviors) {
    this._state.$behaviors = behaviors;
    return this;
  }
  setSeriesLimit(seriesLimit) {
    this._state.seriesLimit = seriesLimit;
    return this;
  }
  applyMixin(mixin) {
    mixin(this);
    return this;
  }
  build() {
    const panel = new VizPanel(__spreadProps(__spreadValues({}, this._state), {
      options: this._panelOptionsBuilder.build(),
      fieldConfig: this._fieldConfigBuilder.build()
    }));
    return panel;
  }
}

const PanelOptionsBuilders = {
  barchart() {
    return new PanelOptionsBuilder(() => BarChartPanelCfg_types_gen.defaultOptions);
  },
  bargauge() {
    return new PanelOptionsBuilder(() => BarGaugePanelCfg_types_gen.defaultOptions);
  },
  datagrid() {
    return new PanelOptionsBuilder(() => DatagridPanelCfg_types_gen.defaultOptions);
  },
  flamegraph() {
    return new PanelOptionsBuilder();
  },
  gauge() {
    return new PanelOptionsBuilder(() => GaugePanelCfg_types_gen.defaultOptions);
  },
  geomap() {
    return new PanelOptionsBuilder(() => GeomapPanelCfg_types_gen.defaultOptions);
  },
  heatmap() {
    return new PanelOptionsBuilder(() => HeatmapPanelCfg_types_gen.defaultOptions);
  },
  histogram() {
    return new PanelOptionsBuilder(() => HistogramPanelCfg_types_gen.defaultOptions);
  },
  logs() {
    return new PanelOptionsBuilder();
  },
  news() {
    return new PanelOptionsBuilder(() => NewsPanelCfg_types_gen.defaultOptions);
  },
  nodegraph() {
    return new PanelOptionsBuilder();
  },
  piechart() {
    return new PanelOptionsBuilder(() => PieChartPanelCfg_types_gen.defaultOptions);
  },
  stat() {
    return new PanelOptionsBuilder(() => StatPanelCfg_types_gen.defaultOptions);
  },
  statetimeline() {
    return new PanelOptionsBuilder(() => StateTimelinePanelCfg_types_gen.defaultOptions);
  },
  statushistory() {
    return new PanelOptionsBuilder(() => StatusHistoryPanelCfg_types_gen.defaultOptions);
  },
  table() {
    return new PanelOptionsBuilder(() => TablePanelCfg_types_gen.defaultOptions);
  },
  text() {
    return new PanelOptionsBuilder(() => TextPanelCfg_types_gen.defaultOptions);
  },
  timeseries() {
    return new PanelOptionsBuilder();
  },
  trend() {
    return new PanelOptionsBuilder();
  },
  traces() {
    return new PanelOptionsBuilder();
  },
  xychart() {
    return new PanelOptionsBuilder(() => XYChartPanelCfg_types_gen.defaultOptions);
  }
};

const FieldConfigBuilders = {
  barchart() {
    return new FieldConfigBuilder(() => BarChartPanelCfg_types_gen.defaultFieldConfig);
  },
  bargauge() {
    return new FieldConfigBuilder();
  },
  datagrid() {
    return new FieldConfigBuilder();
  },
  flamegraph() {
    return new FieldConfigBuilder();
  },
  gauge() {
    return new FieldConfigBuilder();
  },
  geomap() {
    return new FieldConfigBuilder();
  },
  heatmap() {
    return new FieldConfigBuilder();
  },
  histogram() {
    return new FieldConfigBuilder(() => HistogramPanelCfg_types_gen.defaultFieldConfig);
  },
  logs() {
    return new FieldConfigBuilder();
  },
  news() {
    return new FieldConfigBuilder();
  },
  nodegraph() {
    return new FieldConfigBuilder();
  },
  piechart() {
    return new FieldConfigBuilder();
  },
  stat() {
    return new FieldConfigBuilder();
  },
  statetimeline() {
    return new FieldConfigBuilder(() => StateTimelinePanelCfg_types_gen.defaultFieldConfig);
  },
  statushistory() {
    return new FieldConfigBuilder(() => StatusHistoryPanelCfg_types_gen.defaultFieldConfig);
  },
  table() {
    return new FieldConfigBuilder();
  },
  text() {
    return new FieldConfigBuilder();
  },
  timeseries() {
    return new FieldConfigBuilder();
  },
  trend() {
    return new FieldConfigBuilder();
  },
  traces() {
    return new FieldConfigBuilder();
  },
  xychart() {
    return new FieldConfigBuilder(() => XYChartPanelCfg_types_gen.defaultFieldConfig);
  }
};

const PanelBuilders = {
  barchart() {
    return new VizPanelBuilder(
      "barchart",
      "10.0.0",
      () => BarChartPanelCfg_types_gen.defaultOptions,
      () => BarChartPanelCfg_types_gen.defaultFieldConfig
    );
  },
  bargauge() {
    return new VizPanelBuilder("bargauge", "10.0.0", () => BarGaugePanelCfg_types_gen.defaultOptions);
  },
  datagrid() {
    return new VizPanelBuilder("datagrid", "10.0.0", () => DatagridPanelCfg_types_gen.defaultOptions);
  },
  flamegraph() {
    return new VizPanelBuilder("flamegraph", "10.0.0");
  },
  gauge() {
    return new VizPanelBuilder("gauge", "10.0.0", () => GaugePanelCfg_types_gen.defaultOptions);
  },
  geomap() {
    return new VizPanelBuilder("geomap", "10.0.0", () => GeomapPanelCfg_types_gen.defaultOptions);
  },
  heatmap() {
    return new VizPanelBuilder("heatmap", "10.0.0", () => HeatmapPanelCfg_types_gen.defaultOptions);
  },
  histogram() {
    return new VizPanelBuilder(
      "histogram",
      "10.0.0",
      () => HistogramPanelCfg_types_gen.defaultOptions,
      () => HistogramPanelCfg_types_gen.defaultFieldConfig
    );
  },
  logs() {
    return new VizPanelBuilder("logs", "10.0.0");
  },
  news() {
    return new VizPanelBuilder("news", "10.0.0", () => NewsPanelCfg_types_gen.defaultOptions);
  },
  nodegraph() {
    return new VizPanelBuilder("nodeGraph", "10.0.0");
  },
  piechart() {
    return new VizPanelBuilder(
      "piechart",
      "10.0.0",
      () => PieChartPanelCfg_types_gen.defaultOptions
    );
  },
  stat() {
    return new VizPanelBuilder("stat", "10.0.0", () => StatPanelCfg_types_gen.defaultOptions);
  },
  statetimeline() {
    return new VizPanelBuilder(
      "state-timeline",
      "10.0.0",
      () => StateTimelinePanelCfg_types_gen.defaultOptions,
      () => StateTimelinePanelCfg_types_gen.defaultFieldConfig
    );
  },
  statushistory() {
    return new VizPanelBuilder(
      "status-history",
      "10.0.0",
      () => StatusHistoryPanelCfg_types_gen.defaultOptions,
      () => StatusHistoryPanelCfg_types_gen.defaultFieldConfig
    );
  },
  table() {
    return new VizPanelBuilder("table", "10.0.0", () => TablePanelCfg_types_gen.defaultOptions);
  },
  text() {
    return new VizPanelBuilder("text", "10.0.0", () => TextPanelCfg_types_gen.defaultOptions);
  },
  timeseries() {
    return new VizPanelBuilder("timeseries", "10.0.0");
  },
  trend() {
    return new VizPanelBuilder("trend", "10.0.0");
  },
  traces() {
    return new VizPanelBuilder("traces", "10.0.0");
  },
  xychart() {
    return new VizPanelBuilder(
      "xychart",
      "10.0.0",
      () => XYChartPanelCfg_types_gen.defaultOptions,
      () => XYChartPanelCfg_types_gen.defaultFieldConfig
    );
  }
};

class VizConfigBuilder {
  constructor(pluginId, pluginVersion, defaultOptions, defaultFieldConfig) {
    this._pluginId = pluginId;
    this._pluginVersion = pluginVersion;
    this._fieldConfigBuilder = new FieldConfigBuilder(defaultFieldConfig);
    this._panelOptionsBuilder = new PanelOptionsBuilder(defaultOptions);
  }
  setColor(color) {
    this._fieldConfigBuilder.setColor(color);
    return this;
  }
  setDecimals(decimals) {
    this._fieldConfigBuilder.setDecimals(decimals);
    return this;
  }
  setDisplayName(displayName) {
    this._fieldConfigBuilder.setDisplayName(displayName);
    return this;
  }
  setFilterable(filterable) {
    this._fieldConfigBuilder.setFilterable(filterable);
    return this;
  }
  setLinks(links) {
    this._fieldConfigBuilder.setLinks(links);
    return this;
  }
  setMappings(mappings) {
    this._fieldConfigBuilder.setMappings(mappings);
    return this;
  }
  setMax(max) {
    this._fieldConfigBuilder.setMax(max);
    return this;
  }
  setMin(min) {
    this._fieldConfigBuilder.setMin(min);
    return this;
  }
  setNoValue(noValue) {
    this._fieldConfigBuilder.setNoValue(noValue);
    return this;
  }
  setThresholds(thresholds) {
    this._fieldConfigBuilder.setThresholds(thresholds);
    return this;
  }
  setUnit(unit) {
    this._fieldConfigBuilder.setUnit(unit);
    return this;
  }
  setCustomFieldConfig(id, value) {
    this._fieldConfigBuilder.setCustomFieldConfig(id, value);
    return this;
  }
  setOverrides(builder) {
    this._fieldConfigBuilder.setOverrides(builder);
    return this;
  }
  setOption(id, value) {
    this._panelOptionsBuilder.setOption(id, value);
    return this;
  }
  build() {
    return {
      pluginId: this._pluginId,
      pluginVersion: this._pluginVersion,
      options: this._panelOptionsBuilder.build(),
      fieldConfig: this._fieldConfigBuilder.build()
    };
  }
}

const VizConfigBuilders = {
  barchart() {
    return new VizConfigBuilder(
      "barchart",
      "10.0.0",
      () => BarChartPanelCfg_types_gen.defaultOptions,
      () => BarChartPanelCfg_types_gen.defaultFieldConfig
    );
  },
  bargauge() {
    return new VizConfigBuilder("bargauge", "10.0.0", () => BarGaugePanelCfg_types_gen.defaultOptions);
  },
  datagrid() {
    return new VizConfigBuilder("datagrid", "10.0.0", () => DatagridPanelCfg_types_gen.defaultOptions);
  },
  flamegraph() {
    return new VizConfigBuilder("flamegraph", "10.0.0");
  },
  gauge() {
    return new VizConfigBuilder("gauge", "10.0.0", () => GaugePanelCfg_types_gen.defaultOptions);
  },
  geomap() {
    return new VizConfigBuilder("geomap", "10.0.0", () => GeomapPanelCfg_types_gen.defaultOptions);
  },
  heatmap() {
    return new VizConfigBuilder("heatmap", "10.0.0", () => HeatmapPanelCfg_types_gen.defaultOptions);
  },
  histogram() {
    return new VizConfigBuilder(
      "histogram",
      "10.0.0",
      () => HistogramPanelCfg_types_gen.defaultOptions,
      () => HistogramPanelCfg_types_gen.defaultFieldConfig
    );
  },
  logs() {
    return new VizConfigBuilder("logs", "10.0.0");
  },
  news() {
    return new VizConfigBuilder("news", "10.0.0", () => NewsPanelCfg_types_gen.defaultOptions);
  },
  nodegraph() {
    return new VizConfigBuilder("nodeGraph", "10.0.0");
  },
  piechart() {
    return new VizConfigBuilder(
      "piechart",
      "10.0.0",
      () => PieChartPanelCfg_types_gen.defaultOptions
    );
  },
  stat() {
    return new VizConfigBuilder("stat", "10.0.0", () => StatPanelCfg_types_gen.defaultOptions);
  },
  statetimeline() {
    return new VizConfigBuilder(
      "state-timeline",
      "10.0.0",
      () => StateTimelinePanelCfg_types_gen.defaultOptions,
      () => StateTimelinePanelCfg_types_gen.defaultFieldConfig
    );
  },
  statushistory() {
    return new VizConfigBuilder(
      "status-history",
      "10.0.0",
      () => StatusHistoryPanelCfg_types_gen.defaultOptions,
      () => StatusHistoryPanelCfg_types_gen.defaultFieldConfig
    );
  },
  table() {
    return new VizConfigBuilder("table", "10.0.0", () => TablePanelCfg_types_gen.defaultOptions);
  },
  text() {
    return new VizConfigBuilder("text", "10.0.0", () => TextPanelCfg_types_gen.defaultOptions);
  },
  timeseries() {
    return new VizConfigBuilder("timeseries", "10.0.0");
  },
  trend() {
    return new VizConfigBuilder("trend", "10.0.0");
  },
  traces() {
    return new VizConfigBuilder("traces", "10.0.0");
  },
  xychart() {
    return new VizConfigBuilder(
      "xychart",
      "10.0.0",
      () => XYChartPanelCfg_types_gen.defaultOptions,
      () => XYChartPanelCfg_types_gen.defaultFieldConfig
    );
  }
};

const sceneUtils = {
  getUrlWithAppState,
  registerRuntimePanelPlugin,
  registerRuntimeDataSource,
  registerVariableMacro,
  cloneSceneObjectState,
  syncStateFromSearchParams,
  getUrlState,
  renderPrometheusLabelFilters,
  isAdHocVariable,
  isConstantVariable,
  isCustomVariable,
  isDataSourceVariable,
  isIntervalVariable,
  isQueryVariable,
  isTextBoxVariable,
  isGroupByVariable
};

exports.AdHocFiltersVariable = AdHocFiltersVariable;
exports.ConstantVariable = ConstantVariable;
exports.ControlsLabel = ControlsLabel;
exports.CustomVariable = CustomVariable;
exports.DataProviderProxy = DataProviderProxy;
exports.DataSourceVariable = DataSourceVariable;
exports.EmbeddedScene = EmbeddedScene;
exports.FieldConfigBuilder = FieldConfigBuilder;
exports.FieldConfigBuilders = FieldConfigBuilders;
exports.FieldConfigOverridesBuilder = FieldConfigOverridesBuilder;
exports.GroupByVariable = GroupByVariable;
exports.IntervalVariable = IntervalVariable;
exports.LocalValueVariable = LocalValueVariable;
exports.MultiValueVariable = MultiValueVariable;
exports.NestedScene = NestedScene;
exports.NewSceneObjectAddedEvent = NewSceneObjectAddedEvent;
exports.PanelBuilders = PanelBuilders;
exports.PanelOptionsBuilders = PanelOptionsBuilders;
exports.QueryVariable = QueryVariable;
exports.RuntimeDataSource = RuntimeDataSource;
exports.SafeSerializableSceneObject = SafeSerializableSceneObject;
exports.SceneApp = SceneApp;
exports.SceneAppPage = SceneAppPage;
exports.SceneByFrameRepeater = SceneByFrameRepeater;
exports.SceneByVariableRepeater = SceneByVariableRepeater;
exports.SceneCSSGridItem = SceneCSSGridItem;
exports.SceneCSSGridLayout = SceneCSSGridLayout;
exports.SceneCanvasText = SceneCanvasText;
exports.SceneControlsSpacer = SceneControlsSpacer;
exports.SceneDataLayerBase = SceneDataLayerBase;
exports.SceneDataLayerControls = SceneDataLayerControls;
exports.SceneDataLayerSet = SceneDataLayerSet;
exports.SceneDataLayerSetBase = SceneDataLayerSetBase;
exports.SceneDataNode = SceneDataNode;
exports.SceneDataTransformer = SceneDataTransformer;
exports.SceneDebugger = SceneDebugger;
exports.SceneFlexItem = SceneFlexItem;
exports.SceneFlexLayout = SceneFlexLayout;
exports.SceneGridItem = SceneGridItem;
exports.SceneGridLayout = SceneGridLayout;
exports.SceneGridRow = SceneGridRow;
exports.SceneObjectBase = SceneObjectBase;
exports.SceneObjectRef = SceneObjectRef;
exports.SceneObjectStateChangedEvent = SceneObjectStateChangedEvent;
exports.SceneObjectUrlSyncConfig = SceneObjectUrlSyncConfig;
exports.SceneQueryRunner = SceneQueryRunner;
exports.SceneReactObject = SceneReactObject;
exports.SceneRefreshPicker = SceneRefreshPicker;
exports.SceneTimePicker = SceneTimePicker;
exports.SceneTimeRange = SceneTimeRange;
exports.SceneTimeRangeCompare = SceneTimeRangeCompare;
exports.SceneTimeRangeTransformerBase = SceneTimeRangeTransformerBase;
exports.SceneTimeZoneOverride = SceneTimeZoneOverride;
exports.SceneToolbarButton = SceneToolbarButton;
exports.SceneToolbarInput = SceneToolbarInput;
exports.SceneVariableSet = SceneVariableSet;
exports.SceneVariableValueChangedEvent = SceneVariableValueChangedEvent;
exports.SplitLayout = SplitLayout;
exports.TestVariable = TestVariable;
exports.TextBoxVariable = TextBoxVariable;
exports.UrlSyncContextProvider = UrlSyncContextProvider;
exports.UrlSyncManager = UrlSyncManager;
exports.UserActionEvent = UserActionEvent;
exports.VariableDependencyConfig = VariableDependencyConfig;
exports.VariableValueControl = VariableValueControl;
exports.VariableValueSelectWrapper = VariableValueSelectWrapper;
exports.VariableValueSelectors = VariableValueSelectors;
exports.VizConfigBuilder = VizConfigBuilder;
exports.VizConfigBuilders = VizConfigBuilders;
exports.VizPanel = VizPanel;
exports.VizPanelBuilder = VizPanelBuilder;
exports.VizPanelExploreButton = VizPanelExploreButton;
exports.VizPanelMenu = VizPanelMenu;
exports.behaviors = index$1;
exports.dataLayers = index;
exports.formatRegistry = formatRegistry;
exports.getExploreURL = getExploreURL;
exports.isCustomVariableValue = isCustomVariableValue;
exports.isDataLayer = isDataLayer;
exports.isDataRequestEnricher = isDataRequestEnricher;
exports.isFiltersRequestEnricher = isFiltersRequestEnricher;
exports.isSceneObject = isSceneObject;
exports.registerQueryWithController = registerQueryWithController;
exports.registerRuntimeDataSource = registerRuntimeDataSource;
exports.renderSelectForVariable = renderSelectForVariable;
exports.sceneGraph = sceneGraph;
exports.sceneUtils = sceneUtils;
exports.useSceneApp = useSceneApp;
exports.useSceneObjectState = useSceneObjectState;
exports.useUrlSync = useUrlSync;
//# sourceMappingURL=index.js.map
