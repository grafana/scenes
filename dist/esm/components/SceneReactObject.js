import React from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase.js';

var __defProp = Object.defineProperty;
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
class SceneReactObject extends SceneObjectBase {
}
SceneReactObject.Component = ({ model }) => {
  const { component: Component, props, reactNode } = model.useState();
  if (Component) {
    return /* @__PURE__ */ React.createElement(Component, __spreadValues({}, props));
  }
  if (reactNode) {
    return reactNode;
  }
  return null;
};

export { SceneReactObject };
//# sourceMappingURL=SceneReactObject.js.map
