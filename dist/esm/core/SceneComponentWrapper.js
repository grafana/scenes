import React, { useState, useEffect } from 'react';

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
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function SceneComponentWrapperWithoutMemo(_a) {
  var _b = _a, { model } = _b, otherProps = __objRest(_b, ["model"]);
  var _a2;
  const Component = (_a2 = model.constructor["Component"]) != null ? _a2 : EmptyRenderer;
  const [_, setValue] = useState(0);
  useEffect(() => {
    const unsub = model.activate();
    setValue((prevState) => prevState + 1);
    return unsub;
  }, [model]);
  if (!model.isActive) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(Component, __spreadProps(__spreadValues({}, otherProps), {
    model
  }));
}
const SceneComponentWrapper = React.memo(SceneComponentWrapperWithoutMemo);
function EmptyRenderer(_) {
  return null;
}

export { SceneComponentWrapper };
//# sourceMappingURL=SceneComponentWrapper.js.map
