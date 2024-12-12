import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { sceneGraph } from '../../core/sceneGraph/index.js';

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
class LocalValueVariable extends SceneObjectBase {
  constructor(initialState) {
    super(__spreadProps(__spreadValues({
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

export { LocalValueVariable };
//# sourceMappingURL=LocalValueVariable.js.map
