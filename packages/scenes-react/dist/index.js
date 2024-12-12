'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var scenes = require('@grafana/scenes');
var lodash = require('lodash');
var rxjs = require('rxjs');
var ui = require('@grafana/ui');
var reactUse = require('react-use');
var data = require('@grafana/data');
var runtime = require('@grafana/runtime');
var reactRouterDom = require('react-router-dom');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

function writeSceneLog(logger, message, ...rest) {
  let loggingEnabled = false;
  if (typeof window !== "undefined") {
    loggingEnabled = localStorage.getItem("grafana.debug.scenes") === "true";
  }
  if (loggingEnabled) {
    console.log(`${logger}: `, message, ...rest);
  }
}

var __defProp$2 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
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
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
class SceneContextObject extends scenes.SceneObjectBase {
  constructor(state) {
    var _a, _b;
    super(__spreadProps$1(__spreadValues$2({}, state), {
      children: (_a = state == null ? void 0 : state.children) != null ? _a : [],
      childContexts: (_b = state == null ? void 0 : state.childContexts) != null ? _b : []
    }));
  }
  addToScene(obj) {
    this.publishEvent(new scenes.NewSceneObjectAddedEvent(obj), true);
    this.setState({ children: [...this.state.children, obj] });
    writeSceneLog("SceneContext", `Adding to scene: ${obj.constructor.name} key: ${obj.state.key}`);
    const deactivate = obj.activate();
    return () => {
      writeSceneLog("SceneContext", `Removing from scene: ${obj.constructor.name} key: ${obj.state.key}`);
      this.setState({ children: this.state.children.filter((x) => x !== obj) });
      deactivate();
    };
  }
  findByKey(key) {
    return this.state.children.find((x) => x.state.key === key);
  }
  findVariable(name) {
    const variables = this.state.$variables;
    if (!variables) {
      return;
    }
    return variables.getByName(name);
  }
  addVariable(variable) {
    let set = this.state.$variables;
    this.publishEvent(new scenes.NewSceneObjectAddedEvent(variable), true);
    if (set) {
      set.setState({ variables: [...set.state.variables, variable] });
    } else {
      set = new scenes.SceneVariableSet({ variables: [variable] });
      this.setState({ $variables: set });
    }
    writeSceneLog("SceneContext", `Adding variable: ${variable.constructor.name} key: ${variable.state.key}`);
    return () => {
      set.setState({ variables: set.state.variables.filter((x) => x !== variable) });
      writeSceneLog("SceneContext", `Removing variable: ${variable.constructor.name} key: ${variable.state.key}`);
    };
  }
  addChildContext(ctx) {
    var _a;
    this.publishEvent(new scenes.NewSceneObjectAddedEvent(ctx), true);
    this.setState({ childContexts: [...(_a = this.state.childContexts) != null ? _a : [], ctx] });
    writeSceneLog("SceneContext", `Adding child context: ${ctx.constructor.name} key: ${ctx.state.key}`);
  }
  removeChildContext(ctx) {
    var _a;
    this.setState({
      childContexts: (_a = this.state.childContexts) == null ? void 0 : _a.filter((context) => ctx !== context)
    });
    writeSceneLog("SceneContext", `Remvoing child context: ${ctx.constructor.name} key: ${ctx.state.key}`);
  }
}

const SceneContext = React.createContext(null);
function SceneContextProvider({ children, timeRange, withQueryController }) {
  const parentContext = React.useContext(SceneContext);
  const [childContext, setChildContext] = React.useState();
  const initialTimeRange = timeRange;
  React.useEffect(() => {
    const state = { children: [] };
    if (withQueryController) {
      state.$behaviors = [new scenes.behaviors.SceneQueryController()];
    }
    if (initialTimeRange) {
      state.$timeRange = new scenes.SceneTimeRange(initialTimeRange);
    }
    const childContext2 = new SceneContextObject(state);
    if (parentContext) {
      parentContext.addChildContext(childContext2);
    }
    const deactivate = childContext2.activate();
    setChildContext(childContext2);
    return () => {
      deactivate();
      if (parentContext) {
        parentContext.removeChildContext(childContext2);
      }
    };
  }, [parentContext, withQueryController]);
  if (!childContext) {
    return null;
  }
  const innerProvider = /* @__PURE__ */ React__default["default"].createElement(SceneContext.Provider, {
    value: childContext
  }, children);
  if (parentContext) {
    return innerProvider;
  }
  return /* @__PURE__ */ React__default["default"].createElement(scenes.UrlSyncContextProvider, {
    scene: childContext,
    updateUrlOnInit: true,
    createBrowserHistorySteps: true
  }, innerProvider);
}

function useSceneContext() {
  const scene = React.useContext(SceneContext);
  if (!scene) {
    throw new Error("Cannot find a SceneContext");
  }
  return scene;
}
function useTimeRange() {
  const scene = useSceneContext();
  const sceneTimeRange = scenes.sceneGraph.getTimeRange(scene);
  const { value } = sceneTimeRange.useState();
  return [value, sceneTimeRange];
}
function useVariables() {
  const scene = useSceneContext();
  const variables = scenes.sceneGraph.getVariables(scene);
  return variables.useState().variables;
}
function useUpdateWhenSceneChanges({ timeRange, variables = [] }) {
  const scene = useSceneContext();
  const [updateReason, setUpdateReason] = React.useState();
  React.useEffect(() => {
    const subscriptions = new rxjs.Subscription();
    if (variables && variables.length > 0) {
      for (const v of variables) {
        const variable = scenes.sceneGraph.lookupVariable(v, scene);
        if (variable) {
          subscriptions.add(
            variable.subscribeToEvent(scenes.SceneVariableValueChangedEvent, () => {
              setUpdateReason({ variableName: variable.state.name, variableValue: variable.getValue() });
            })
          );
        }
      }
    }
    if (timeRange) {
      const tr = scenes.sceneGraph.getTimeRange(scene);
      tr.subscribeToState((newState, oldState) => {
        if (newState.value !== oldState.value) {
          setUpdateReason({ timeRange: newState.value });
        }
      });
    }
    return () => subscriptions.unsubscribe();
  }, [scene, timeRange, ...variables]);
  return updateReason;
}
function useVariableInterpolator(options) {
  const scene = useSceneContext();
  useUpdateWhenSceneChanges(options);
  return React.useCallback(
    (str) => {
      return scenes.sceneGraph.interpolate(scene, str);
    },
    [scene]
  );
}

function useQueryRunner(options) {
  const scene = useSceneContext();
  const key = React.useId();
  let queryRunner = scene.findByKey(key);
  if (!queryRunner) {
    queryRunner = new scenes.SceneQueryRunner({
      key,
      queries: options.queries,
      maxDataPoints: options.maxDataPoints,
      datasource: options.datasource,
      liveStreaming: options.liveStreaming,
      maxDataPointsFromWidth: options.maxDataPointsFromWidth
    });
  }
  React.useEffect(() => scene.addToScene(queryRunner), [queryRunner, scene]);
  React.useEffect(() => {
    if (!lodash.isEqual(queryRunner.state.queries, options.queries)) {
      queryRunner.setState({ queries: options.queries });
      queryRunner.runQueries();
    }
  }, [queryRunner, options]);
  return queryRunner;
}

function useDataTransformer(options) {
  const scene = useSceneContext();
  const key = React.useId();
  let dataTransformer = scene.findByKey(key);
  if (!dataTransformer) {
    dataTransformer = new scenes.SceneDataTransformer({
      key,
      $data: new scenes.DataProviderProxy({ source: options.data.getRef() }),
      transformations: options.transformations
    });
  }
  React.useEffect(() => scene.addToScene(dataTransformer), [dataTransformer, scene]);
  React.useEffect(() => {
    if (!lodash.isEqual(dataTransformer.state.transformations, options.transformations)) {
      dataTransformer.setState({ transformations: options.transformations });
      dataTransformer.reprocessTransformations();
    }
  }, [dataTransformer, options.transformations]);
  return dataTransformer;
}

function TimeRangePicker(props) {
  const [value, sceneTimeRange] = useTimeRange();
  return /* @__PURE__ */ React__default["default"].createElement(ui.TimeRangePicker, {
    isOnCanvas: true,
    value,
    onChange: sceneTimeRange.onTimeRangeChange,
    timeZone: sceneTimeRange.getTimeZone(),
    onMoveBackward: () => {
    },
    onMoveForward: () => {
    },
    onZoom: () => {
    },
    onChangeTimeZone: () => {
    },
    onChangeFiscalYearStartMonth: () => {
    }
  });
}

function VariableControl({ name, hideLabel, layout }) {
  const scene = useSceneContext();
  const variable = scenes.sceneGraph.lookupVariable(name, scene);
  if (!variable) {
    return /* @__PURE__ */ React__default["default"].createElement("div", null, "Variable ", name, " not found");
  }
  return /* @__PURE__ */ React__default["default"].createElement(scenes.VariableValueSelectWrapper, {
    key: variable.state.key,
    variable,
    hideLabel,
    layout
  });
}

function VizPanel(props) {
  const { title, viz, dataProvider, headerActions } = props;
  const scene = useSceneContext();
  const key = React.useId();
  const prevProps = reactUse.usePrevious(props);
  let panel = scene.findByKey(key);
  if (!panel) {
    panel = new scenes.VizPanel({
      key,
      title,
      pluginId: viz.pluginId,
      pluginVersion: viz.pluginVersion,
      options: viz.options,
      fieldConfig: viz.fieldConfig,
      $data: getDataProviderForVizPanel(dataProvider),
      headerActions
    });
  }
  React.useEffect(() => scene.addToScene(panel), [panel, scene]);
  React.useEffect(() => {
    const stateUpdate = {};
    if (!prevProps) {
      return;
    }
    if (title !== prevProps.title) {
      stateUpdate.title = title;
    }
    if (headerActions !== prevProps.headerActions) {
      stateUpdate.headerActions = headerActions;
    }
    if (dataProvider !== prevProps.dataProvider) {
      stateUpdate.$data = getDataProviderForVizPanel(dataProvider);
    }
    if (viz !== prevProps.viz) {
      if (viz.pluginId === prevProps.viz.pluginId) {
        const plugin = panel.getPlugin();
        if (plugin) {
          const optionsWithDefaults = data.getPanelOptionsWithDefaults({
            plugin,
            currentOptions: viz.options,
            currentFieldConfig: viz.fieldConfig,
            isAfterPluginChange: false
          });
          stateUpdate.options = optionsWithDefaults.options;
          stateUpdate.fieldConfig = optionsWithDefaults.fieldConfig;
          panel.clearFieldConfigCache();
        }
      }
    }
    if (Object.keys(stateUpdate).length > 0) {
      panel.setState(stateUpdate);
      writeSceneLog("VizPanel", "Updating VizPanel state", stateUpdate);
    }
  }, [panel, title, headerActions, viz, dataProvider, prevProps]);
  return /* @__PURE__ */ React__default["default"].createElement(panel.Component, {
    model: panel
  });
}
function getDataProviderForVizPanel(data) {
  if (data && !(data instanceof scenes.SceneDataNode)) {
    return new scenes.DataProviderProxy({ source: data.getRef() });
  }
  return data;
}

var __defProp$1 = Object.defineProperty;
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
function RefreshPicker(props) {
  const scene = useSceneContext();
  const key = React.useId();
  const prevProps = reactUse.usePrevious(props);
  let picker = scene.findByKey(key);
  if (!picker) {
    picker = new scenes.SceneRefreshPicker(__spreadValues$1({
      key
    }, props));
  }
  React.useEffect(() => scene.addToScene(picker), [picker, scene]);
  React.useEffect(() => {
    const stateUpdate = {};
    if (!prevProps) {
      return;
    }
    if (props.refresh !== prevProps.refresh) {
      stateUpdate.refresh = props.refresh;
    }
    if (props.withText !== prevProps.withText) {
      stateUpdate.withText = props.withText;
    }
    picker.setState(stateUpdate);
  }, [picker, props, prevProps]);
  return /* @__PURE__ */ React__default["default"].createElement(picker.Component, {
    model: picker
  });
}

function DataLayerControl({ name }) {
  const scene = useSceneContext();
  const layerSets = scenes.sceneGraph.getDataLayers(scene);
  const layer = getLayer(layerSets, name);
  if (!layer) {
    return /* @__PURE__ */ React__default["default"].createElement("div", null, "Annotation ", name, " not found");
  }
  return /* @__PURE__ */ React__default["default"].createElement(layer.Component, {
    model: layer
  });
}
function getLayer(layers, name) {
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i].state.layers.find((layer2) => layer2.state.name === name);
    if (layer) {
      return layer;
    }
  }
  return void 0;
}

function CustomVariable({
  query,
  name,
  label,
  hide,
  initialValue,
  isMulti,
  includeAll,
  children
}) {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = React.useState();
  let variable = scene.findVariable(name);
  if (!variable) {
    variable = new scenes.CustomVariable({ name, label, query, value: initialValue, isMulti, includeAll, hide });
  }
  React.useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);
  React.useEffect(() => {
    variable == null ? void 0 : variable.setState({
      label,
      query,
      hide,
      isMulti,
      includeAll
    });
  }, [hide, includeAll, isMulti, label, query, variable]);
  if (!variableAdded) {
    return null;
  }
  return children;
}

function DataSourceVariable({
  pluginId,
  regex,
  name,
  label,
  hide,
  initialValue,
  isMulti,
  includeAll,
  children
}) {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = React.useState();
  let variable = scene.findVariable(name);
  if (!variable) {
    variable = new scenes.DataSourceVariable({
      pluginId,
      regex,
      name,
      label,
      value: initialValue,
      isMulti,
      hide,
      includeAll
    });
  }
  React.useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);
  React.useEffect(() => {
    if (!variableAdded) {
      return;
    }
    if (variable.state.pluginId === pluginId && variable.state.regex === regex && variable.state.label === label && variable.state.hide === hide && variable.state.includeAll === includeAll) {
      return;
    }
    variable.setState({
      pluginId,
      regex,
      label,
      hide,
      includeAll
    });
    variable.refreshOptions();
  }, [hide, includeAll, label, pluginId, regex, variable, variableAdded]);
  if (!variableAdded) {
    return null;
  }
  return children;
}

function QueryVariable({
  query,
  name,
  datasource,
  label,
  hide,
  regex,
  refresh,
  sort,
  initialValue,
  isMulti,
  includeAll,
  children
}) {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = React.useState();
  let variable = scene.findVariable(name);
  if (!variable) {
    variable = new scenes.QueryVariable({
      name,
      label,
      query,
      datasource,
      refresh,
      sort,
      regex,
      value: initialValue,
      isMulti,
      hide,
      includeAll
    });
  }
  React.useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);
  React.useEffect(() => {
    if (!variableAdded) {
      return;
    }
    if (lodash.isEqual(variable.state.query, query) && lodash.isEqual(variable.state.datasource, datasource) && variable.state.regex === regex && variable.state.label === label && variable.state.hide === hide && variable.state.includeAll === includeAll && variable.state.refresh === refresh && variable.state.sort === sort) {
      return;
    }
    variable.setState({
      label,
      query,
      datasource,
      refresh,
      sort,
      regex,
      hide,
      includeAll
    });
    variable.refreshOptions();
  }, [datasource, hide, includeAll, label, query, refresh, regex, sort, variable, variableAdded]);
  if (!variableAdded) {
    return null;
  }
  return children;
}

const BreadcrumbContext = React.createContext({
  breadcrumbs: [],
  addBreadcrumb: () => {
  },
  removeBreadcrumb: () => {
  }
});
function BreadcrumbProvider({ children }) {
  const [breadcrumbs, setBreadcrumbs] = React.useState([]);
  return /* @__PURE__ */ React__default["default"].createElement(BreadcrumbContext.Provider, {
    value: {
      breadcrumbs,
      addBreadcrumb: React.useCallback((breadcrumb) => setBreadcrumbs((prev) => [...prev, breadcrumb]), []),
      removeBreadcrumb: React.useCallback(
        (breadcrumb) => setBreadcrumbs((prev) => prev.filter((b) => b.url !== breadcrumb.url)),
        []
      )
    }
  }, children);
}
function Breadcrumb({ text, path, extraKeys }) {
  const { addBreadcrumb, removeBreadcrumb } = React.useContext(BreadcrumbContext);
  const buildUrl = useUrlBuilder();
  React.useEffect(() => {
    const breadcrumb = {
      text,
      url: buildUrl(path, extraKeys)
    };
    addBreadcrumb(breadcrumb);
    return () => {
      removeBreadcrumb(breadcrumb);
    };
  }, [text, path, extraKeys, addBreadcrumb, buildUrl, removeBreadcrumb]);
  return null;
}
function useUrlBuilder() {
  const queryParams = useQueryParams()[0];
  const variables = useVariables();
  const [_, timeRange] = useTimeRange();
  return React.useCallback(
    (urlBase, extraKeys) => {
      const params = {};
      for (const v of variables) {
        if (v.urlSync && !v.state.skipUrlSync) {
          const state = v.urlSync.getUrlState();
          Object.assign(params, state);
        }
      }
      if (timeRange.urlSync) {
        const state = timeRange.urlSync.getUrlState();
        Object.assign(params, state);
      }
      if (extraKeys) {
        for (const extra of extraKeys) {
          if (queryParams[extra]) {
            params[extra] = queryParams[extra];
          }
        }
      }
      return data.urlUtil.renderUrl(urlBase, params);
    },
    [variables, queryParams, timeRange]
  );
}
function useQueryParams() {
  const { search } = reactRouterDom.useLocation();
  const queryParams = React.useMemo(() => runtime.locationSearchToObject(search || ""), [search]);
  const update = React.useCallback((values, replace) => runtime.locationService.partial(values, replace), []);
  return [queryParams, update];
}

function useVariableValues(name) {
  const scene = useSceneContext();
  const variable = scenes.sceneGraph.lookupVariable(name, scene);
  if (!variable) {
    return [void 0, false];
  }
  variable.useState();
  const set = variable.parent;
  const isLoading = set.isVariableLoadingOrWaitingToUpdate(variable);
  let value = variable.getValue();
  if (value == null) {
    return [void 0, isLoading];
  }
  if (!Array.isArray(value)) {
    value = [value];
  }
  return [value, isLoading];
}

function useVariableValue(name) {
  const scene = useSceneContext();
  const variable = scenes.sceneGraph.lookupVariable(name, scene);
  if (!variable || variable instanceof scenes.MultiValueVariable && variable.state.isMulti === true) {
    return [void 0, false];
  }
  variable.useState();
  const set = variable.parent;
  const isLoading = set.isVariableLoadingOrWaitingToUpdate(variable);
  let value = variable.getValue();
  if (value == null) {
    return [void 0, isLoading];
  }
  return [value, isLoading];
}

function AnnotationLayer({ name, query, children }) {
  const scene = useSceneContext();
  const [annotationAdded, setAnnotationAdded] = React.useState();
  let annotation = findAnnotationLayer(scene, name);
  if (!annotation) {
    annotation = new scenes.dataLayers.AnnotationsDataLayer({ name, query });
  }
  React.useEffect(() => {
    const removeFn = addAnnotationLayer(scene, annotation);
    setAnnotationAdded(true);
    return removeFn;
  }, [scene, name, annotation]);
  React.useEffect(() => {
  }, [annotationAdded]);
  if (!annotationAdded) {
    return null;
  }
  return children;
}
function findAnnotationLayer(scene, name) {
  const annotations = scene.state.$data;
  if (!annotations) {
    return;
  }
  return annotations.state.layers.find((anno) => anno.state.name === name);
}
function addAnnotationLayer(scene, layer) {
  let set = scene.state.$data;
  if (set) {
    set.setState({ layers: [...set.state.layers, layer] });
  } else {
    set = new scenes.SceneDataLayerSet({ layers: [layer] });
    scene.setState({ $data: set });
  }
  writeSceneLog("SceneContext", `Adding annotation data layer: ${layer.state.name} key: ${layer.state.key}`);
  return () => {
    set.setState({ layers: set.state.layers.filter((x) => x !== layer) });
    writeSceneLog("SceneContext", `Removing annotation data layer: ${layer.state.name} key: ${layer.state.key}`);
  };
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
class EmbeddedSceneWithContext extends scenes.EmbeddedScene {
  constructor(state) {
    super(__spreadProps(__spreadValues({}, state), { context: new SceneContextObject() }));
  }
}
EmbeddedSceneWithContext.Component = ({ model }) => {
  return /* @__PURE__ */ React__default["default"].createElement(SceneContext.Provider, {
    value: model.state.context
  }, /* @__PURE__ */ React__default["default"].createElement(scenes.EmbeddedScene.Component, {
    model
  }));
};

function VizGridLayout({ children, minWidth = 400, minHeight = 320 }) {
  const theme = ui.useTheme2();
  const style = {
    display: "grid",
    flexGrow: 1,
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    gridAutoRows: `minmax(${minHeight}px, auto)`,
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(1)
  };
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    style
  }, children);
}

exports.AnnotationLayer = AnnotationLayer;
exports.Breadcrumb = Breadcrumb;
exports.BreadcrumbContext = BreadcrumbContext;
exports.BreadcrumbProvider = BreadcrumbProvider;
exports.CustomVariable = CustomVariable;
exports.DataLayerControl = DataLayerControl;
exports.DataSourceVariable = DataSourceVariable;
exports.EmbeddedSceneWithContext = EmbeddedSceneWithContext;
exports.QueryVariable = QueryVariable;
exports.RefreshPicker = RefreshPicker;
exports.SceneContext = SceneContext;
exports.SceneContextObject = SceneContextObject;
exports.SceneContextProvider = SceneContextProvider;
exports.TimeRangePicker = TimeRangePicker;
exports.VariableControl = VariableControl;
exports.VizGridLayout = VizGridLayout;
exports.VizPanel = VizPanel;
exports.useDataTransformer = useDataTransformer;
exports.useQueryRunner = useQueryRunner;
exports.useSceneContext = useSceneContext;
exports.useTimeRange = useTimeRange;
exports.useUpdateWhenSceneChanges = useUpdateWhenSceneChanges;
exports.useVariableInterpolator = useVariableInterpolator;
exports.useVariableValue = useVariableValue;
exports.useVariableValues = useVariableValues;
exports.useVariables = useVariables;
//# sourceMappingURL=index.js.map
