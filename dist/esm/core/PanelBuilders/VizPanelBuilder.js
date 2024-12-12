import { VizPanel } from '../../components/VizPanel/VizPanel.js';
import { FieldConfigBuilder } from './FieldConfigBuilder.js';
import { PanelOptionsBuilder } from './PanelOptionsBuilder.js';

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
  setMenu(menu) {
    this._state.menu = menu;
    return this;
  }
  setHeaderActions(headerActions) {
    this._state.headerActions = headerActions;
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

export { VizPanelBuilder };
//# sourceMappingURL=VizPanelBuilder.js.map
