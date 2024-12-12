import { cloneDeep, merge } from 'lodash';
import { FieldConfigOverridesBuilder } from './FieldConfigOverridesBuilder.js';

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
        custom: this.defaultFieldConfig ? cloneDeep(this.defaultFieldConfig()) : {}
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
    this._fieldConfig.defaults = __spreadProps(__spreadValues({}, this._fieldConfig.defaults), {
      custom: merge(this._fieldConfig.defaults.custom, { [id]: value })
    });
    return this;
  }
  setOverrides(builder) {
    builder(this._overridesBuilder);
    return this;
  }
  setFieldConfigDefaults(key, value) {
    this._fieldConfig.defaults = __spreadProps(__spreadValues({}, this._fieldConfig.defaults), {
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

export { FieldConfigBuilder };
//# sourceMappingURL=FieldConfigBuilder.js.map
