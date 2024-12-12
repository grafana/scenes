import React from 'react';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { SceneObjectUrlSyncConfig } from '../../services/SceneObjectUrlSyncConfig.js';
import { VariableValueInput } from '../components/VariableValueInput.js';
import { SceneVariableValueChangedEvent } from '../types.js';

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
class TextBoxVariable extends SceneObjectBase {
  constructor(initialState) {
    super(__spreadValues({
      type: "textbox",
      value: "",
      name: ""
    }, initialState));
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => [this.getKey()] });
  }
  getValue() {
    return this.state.value;
  }
  setValue(newValue) {
    if (newValue !== this.state.value) {
      this.setState({ value: newValue });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
  getKey() {
    return `var-${this.state.name}`;
  }
  getUrlState() {
    return { [this.getKey()]: this.state.value };
  }
  updateFromUrl(values) {
    const val = values[this.getKey()];
    if (typeof val === "string") {
      this.setValue(val);
    }
  }
}
TextBoxVariable.Component = ({ model }) => {
  return /* @__PURE__ */ React.createElement(VariableValueInput, {
    model
  });
};

export { TextBoxVariable };
//# sourceMappingURL=TextBoxVariable.js.map
