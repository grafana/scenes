import { FieldConfigBuilder } from './FieldConfigBuilder.js';
import { PanelOptionsBuilder } from './PanelOptionsBuilder.js';

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

export { VizConfigBuilder };
//# sourceMappingURL=VizConfigBuilder.js.map
