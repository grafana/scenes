import React, { useId, useEffect } from 'react';
import { useSceneContext } from '../hooks/hooks.js';
import { SceneRefreshPicker } from '@grafana/scenes';
import { usePrevious } from 'react-use';

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
function RefreshPicker(props) {
  const scene = useSceneContext();
  const key = useId();
  const prevProps = usePrevious(props);
  let picker = scene.findByKey(key);
  if (!picker) {
    picker = new SceneRefreshPicker(__spreadValues({
      key
    }, props));
  }
  useEffect(() => scene.addToScene(picker), [picker, scene]);
  useEffect(() => {
    const stateUpdate = {};
    if (!prevProps) {
      return;
    }
    if (props.refresh !== prevProps.refresh) {
      stateUpdate.refresh = props.refresh;
    }
    if (props.withText !== prevProps.withText) {
      stateUpdate.withText = props.withText;
    }
    picker.setState(stateUpdate);
  }, [picker, props, prevProps]);
  return /* @__PURE__ */ React.createElement(picker.Component, {
    model: picker
  });
}

export { RefreshPicker };
//# sourceMappingURL=RefreshPicker.js.map
