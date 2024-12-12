import { getFieldDisplayName, formatLabels } from '@grafana/data';

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
function getTemplateProxyForField(field, frame, frames) {
  return new Proxy(
    {},
    {
      get: (obj, key) => {
        if (key === "name") {
          return field.name;
        }
        if (key === "displayName") {
          return getFieldDisplayName(field, frame, frames);
        }
        if (key === "labels" || key === "formattedLabels") {
          if (!field.labels) {
            return "";
          }
          return __spreadProps(__spreadValues({}, field.labels), {
            __values: Object.values(field.labels).sort().join(", "),
            toString: () => {
              return formatLabels(field.labels, "", true);
            }
          });
        }
        return void 0;
      }
    }
  );
}

export { getTemplateProxyForField };
//# sourceMappingURL=templateProxies.js.map
