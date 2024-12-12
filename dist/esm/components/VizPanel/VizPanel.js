import { toUtc, getPanelOptionsWithDefaults, renderMarkdown, applyFieldOverrides, compareArrayValues, compareDataFrameStructures, CoreApp, DashboardCursorSync, PanelPlugin, PluginType } from '@grafana/data';
import { getPluginImportUtils, config, getAppEvents } from '@grafana/runtime';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { VizPanelRenderer } from './VizPanelRenderer.js';
import { VariableDependencyConfig } from '../../variables/VariableDependencyConfig.js';
import { seriesVisibilityConfigFactory } from './seriesVisibilityConfigFactory.js';
import { emptyPanelData } from '../../core/SceneDataNode.js';
import { changeSeriesColorConfigFactory } from './colorSeriesConfigFactory.js';
import { loadPanelPluginSync } from './registerRuntimePanelPlugin.js';
import { getCursorSyncScope } from '../../behaviors/CursorSync.js';
import { mergeWith, cloneDeep, isArray, merge, isEmpty } from 'lodash';
import { UserActionEvent } from '../../core/events.js';
import { evaluateTimeRange } from '../../utils/evaluateTimeRange.js';
import { LiveNowTimer } from '../../behaviors/LiveNowTimer.js';

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
class VizPanel extends SceneObjectBase {
  constructor(state) {
    var _a;
    super(__spreadValues({
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
          from: toUtc(timeRange.from),
          to: toUtc(timeRange.to)
        },
        from: toUtc(timeRange.from),
        to: toUtc(timeRange.to)
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
          sceneTimeRange.state.UNSAFE_nowDelay
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
    this.onOptionsChange = (optionsUpdate, replace = false, isAfterPluginChange = false) => {
      var _a;
      const { fieldConfig, options } = this.state;
      const nextOptions = replace ? optionsUpdate : mergeWith(cloneDeep(options), optionsUpdate, (objValue, srcValue, key, obj) => {
        if (isArray(srcValue)) {
          return srcValue;
        }
        if (objValue !== srcValue && typeof srcValue === "undefined") {
          obj[key] = srcValue;
          return;
        }
        return;
      });
      const withDefaults = getPanelOptionsWithDefaults({
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
      const nextFieldConfig = replace ? fieldConfigUpdate : merge(cloneDeep(fieldConfig), fieldConfigUpdate);
      const withDefaults = getPanelOptionsWithDefaults({
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
        return renderMarkdown(markdown);
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
        this._panelContext = __spreadProps(__spreadValues({}, this._panelContext), {
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
        __spreadProps(__spreadValues({}, this.state.options), {
          legend: __spreadProps(__spreadValues({}, legendOptions), { sortBy, sortDesc })
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
  async _loadPlugin(pluginId, overwriteOptions, overwriteFieldConfig, isAfterPluginChange) {
    const plugin = loadPanelPluginSync(pluginId);
    if (plugin) {
      this._pluginLoaded(plugin, overwriteOptions, overwriteFieldConfig, isAfterPluginChange);
    } else {
      const { importPanelPlugin } = getPluginImportUtils();
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
    if (plugin.onPanelMigration && currentVersion !== this.state.pluginVersion) {
      panel.options = await plugin.onPanelMigration(panel);
    }
    const withDefaults = getPanelOptionsWithDefaults({
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
    return plugin && plugin.meta.info.version ? plugin.meta.info.version : config.buildInfo.version;
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
    const {
      options: prevOptions,
      fieldConfig: prevFieldConfig,
      pluginId: prevPluginId
    } = this.state;
    this._dataWithFieldConfig = void 0;
    await this._loadPlugin(pluginId, newOptions != null ? newOptions : {}, newFieldConfig, true);
    const panel = {
      title: this.state.title,
      options: this.state.options,
      fieldConfig: this.state.fieldConfig,
      id: 1,
      type: pluginId
    };
    const updatedOptions = (_b = (_a = this._plugin) == null ? void 0 : _a.onPanelTypeChanged) == null ? void 0 : _b.call(_a, panel, prevPluginId, prevOptions, prevFieldConfig);
    if (updatedOptions && !isEmpty(updatedOptions)) {
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
    const newFrames = applyFieldOverrides({
      data: rawData.series,
      fieldConfig: this.state.fieldConfig,
      fieldConfigRegistry,
      replaceVariables: this.interpolate,
      theme: config.theme2,
      timeZone: (_c = rawData.request) == null ? void 0 : _c.timezone
    });
    if (!compareArrayValues(newFrames, prevFrames, compareDataFrameStructures)) {
      this._structureRev++;
    }
    this._dataWithFieldConfig = __spreadProps(__spreadValues({}, rawData), {
      structureRev: this._structureRev,
      series: newFrames
    });
    if (this._dataWithFieldConfig.annotations) {
      this._dataWithFieldConfig.annotations = applyFieldOverrides({
        data: this._dataWithFieldConfig.annotations,
        fieldConfig: {
          defaults: {},
          overrides: []
        },
        fieldConfigRegistry,
        replaceVariables: this.interpolate,
        theme: config.theme2,
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
      eventBus: sync ? sync.getEventsBus(this) : getAppEvents(),
      app: CoreApp.Unknown,
      sync: () => {
        if (sync) {
          return sync.state.sync;
        }
        return DashboardCursorSync.Off;
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
  const plugin = new PanelPlugin(() => null);
  plugin.meta = {
    id,
    name: id,
    sort: 100,
    type: PluginType.panel,
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

export { VizPanel };
//# sourceMappingURL=VizPanel.js.map
