import { of } from 'rxjs';
import { VariableDependencyConfig } from '../VariableDependencyConfig.js';
import { renderSelectForVariable } from '../components/VariableValueSelect.js';
import { MultiValueVariable } from './MultiValueVariable.js';
import { sceneGraph } from '../../core/sceneGraph/index.js';

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
class CustomVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadValues({
      type: "custom",
      query: "",
      value: "",
      text: "",
      options: [],
      name: ""
    }, initialState));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["query"]
    });
  }
  getValueOptions(args) {
    var _a;
    const interpolated = sceneGraph.interpolate(this, this.state.query);
    const match = (_a = interpolated.match(/(?:\\,|[^,])+/g)) != null ? _a : [];
    const options = match.map((text) => {
      var _a2;
      text = text.replace(/\\,/g, ",");
      const textMatch = (_a2 = /^(.+)\s:\s(.+)$/g.exec(text)) != null ? _a2 : [];
      if (textMatch.length === 3) {
        const [, key, value] = textMatch;
        return { label: key.trim(), value: value.trim() };
      } else {
        return { label: text.trim(), value: text.trim() };
      }
    });
    return of(options);
  }
}
CustomVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};

export { CustomVariable };
//# sourceMappingURL=CustomVariable.js.map
