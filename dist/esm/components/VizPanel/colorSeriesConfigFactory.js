import { FieldMatcherID, FieldColorModeId } from '@grafana/data';

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
const changeSeriesColorConfigFactory = (label, color, fieldConfig) => {
  const { overrides } = fieldConfig;
  const currentIndex = fieldConfig.overrides.findIndex((override) => {
    return override.matcher.id === FieldMatcherID.byName && override.matcher.options === label;
  });
  if (currentIndex < 0) {
    return __spreadProps(__spreadValues({}, fieldConfig), {
      overrides: [...fieldConfig.overrides, createOverride(label, color)]
    });
  }
  const overridesCopy = Array.from(overrides);
  const existing = overridesCopy[currentIndex];
  const propertyIndex = existing.properties.findIndex((p) => p.id === "color");
  if (propertyIndex < 0) {
    overridesCopy[currentIndex] = __spreadProps(__spreadValues({}, existing), {
      properties: [...existing.properties, createProperty(color)]
    });
    return __spreadProps(__spreadValues({}, fieldConfig), {
      overrides: overridesCopy
    });
  }
  const propertiesCopy = Array.from(existing.properties);
  propertiesCopy[propertyIndex] = createProperty(color);
  overridesCopy[currentIndex] = __spreadProps(__spreadValues({}, existing), {
    properties: propertiesCopy
  });
  return __spreadProps(__spreadValues({}, fieldConfig), {
    overrides: overridesCopy
  });
};
const createOverride = (label, color) => {
  return {
    matcher: {
      id: FieldMatcherID.byName,
      options: label
    },
    properties: [createProperty(color)]
  };
};
const createProperty = (color) => {
  return {
    id: "color",
    value: {
      mode: FieldColorModeId.Fixed,
      fixedColor: color
    }
  };
};

export { changeSeriesColorConfigFactory };
//# sourceMappingURL=colorSeriesConfigFactory.js.map
