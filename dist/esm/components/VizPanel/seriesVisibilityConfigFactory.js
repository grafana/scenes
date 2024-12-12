import { isSystemOverrideWithRef, FieldMatcherID, ByNamesMatcherMode, FieldType, getFieldDisplayName, fieldMatchers } from '@grafana/data';
import { SeriesVisibilityChangeMode } from '@grafana/ui';

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
const displayOverrideRef = "hideSeriesFrom";
const isHideSeriesOverride = isSystemOverrideWithRef(displayOverrideRef);
function seriesVisibilityConfigFactory(label, mode, fieldConfig, data) {
  const { overrides } = fieldConfig;
  const displayName = label;
  const currentIndex = overrides.findIndex(isHideSeriesOverride);
  if (currentIndex < 0) {
    if (mode === SeriesVisibilityChangeMode.ToggleSelection) {
      const override3 = createOverride([displayName, ...getNamesOfHiddenFields(overrides, data)]);
      return __spreadProps(__spreadValues({}, fieldConfig), {
        overrides: [...fieldConfig.overrides, override3]
      });
    }
    const displayNames = getDisplayNames(data, displayName);
    const override2 = createOverride(displayNames);
    return __spreadProps(__spreadValues({}, fieldConfig), {
      overrides: [...fieldConfig.overrides, override2]
    });
  }
  const overridesCopy = Array.from(overrides);
  const [current] = overridesCopy.splice(currentIndex, 1);
  if (mode === SeriesVisibilityChangeMode.ToggleSelection) {
    let existing = getExistingDisplayNames(current);
    const nameOfHiddenFields = getNamesOfHiddenFields(overridesCopy, data);
    if (nameOfHiddenFields.length > 0) {
      existing = existing.filter((el) => nameOfHiddenFields.indexOf(el) < 0);
    }
    if (existing[0] === displayName && existing.length === 1) {
      return __spreadProps(__spreadValues({}, fieldConfig), {
        overrides: overridesCopy
      });
    }
    const override2 = createOverride([displayName, ...nameOfHiddenFields]);
    return __spreadProps(__spreadValues({}, fieldConfig), {
      overrides: [...overridesCopy, override2]
    });
  }
  const override = createExtendedOverride(current, displayName);
  if (allFieldsAreExcluded(override, data)) {
    return __spreadProps(__spreadValues({}, fieldConfig), {
      overrides: overridesCopy
    });
  }
  return __spreadProps(__spreadValues({}, fieldConfig), {
    overrides: [...overridesCopy, override]
  });
}
function createOverride(names, mode = ByNamesMatcherMode.exclude, property) {
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
      id: FieldMatcherID.byNames,
      options: {
        mode,
        names,
        prefix: mode === ByNamesMatcherMode.exclude ? "All except:" : void 0,
        readOnly: true
      }
    },
    properties: [
      __spreadProps(__spreadValues({}, property), {
        value: {
          viz: true,
          legend: false,
          tooltip: false
        }
      })
    ]
  };
}
const createExtendedOverride = (current, displayName, mode = ByNamesMatcherMode.exclude) => {
  const property = current.properties.find((p) => p.id === "custom.hideFrom");
  const existing = getExistingDisplayNames(current);
  const index = existing.findIndex((name) => name === displayName);
  if (index < 0) {
    existing.push(displayName);
  } else {
    existing.splice(index, 1);
  }
  return createOverride(existing, mode, property);
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
const getDisplayNames = (data, excludeName) => {
  const unique = /* @__PURE__ */ new Set();
  for (const frame of data) {
    for (const field of frame.fields) {
      if (field.type !== FieldType.number) {
        continue;
      }
      const name = getFieldDisplayName(field, frame, data);
      if (name === excludeName) {
        continue;
      }
      unique.add(name);
    }
  }
  return Array.from(unique);
};
const getNamesOfHiddenFields = (overrides, data) => {
  var _a;
  let names = [];
  for (const override of overrides) {
    const property = override.properties.find((p) => p.id === "custom.hideFrom");
    if (property !== void 0 && ((_a = property.value) == null ? void 0 : _a.legend) === true) {
      const info = fieldMatchers.get(override.matcher.id);
      const matcher = info.get(override.matcher.options);
      for (const frame of data) {
        for (const field of frame.fields) {
          if (field.type !== FieldType.number) {
            continue;
          }
          const name = getFieldDisplayName(field, frame, data);
          if (matcher(field, frame, data)) {
            names.push(name);
          }
        }
      }
    }
  }
  return names;
};

export { seriesVisibilityConfigFactory };
//# sourceMappingURL=seriesVisibilityConfigFactory.js.map
