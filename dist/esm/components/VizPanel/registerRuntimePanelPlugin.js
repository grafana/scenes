import { getPluginImportUtils } from '@grafana/runtime';

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
const runtimePanelPlugins = /* @__PURE__ */ new Map();
function registerRuntimePanelPlugin({ pluginId, plugin }) {
  if (runtimePanelPlugins.has(pluginId)) {
    throw new Error(`A runtime panel plugin with id ${pluginId} has already been registered`);
  }
  plugin.meta = __spreadProps(__spreadValues({}, plugin.meta), {
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
  const { getPanelPluginFromCache } = getPluginImportUtils();
  return (_a = getPanelPluginFromCache(pluginId)) != null ? _a : runtimePanelPlugins.get(pluginId);
}

export { loadPanelPluginSync, registerRuntimePanelPlugin, runtimePanelPlugins };
//# sourceMappingURL=registerRuntimePanelPlugin.js.map
