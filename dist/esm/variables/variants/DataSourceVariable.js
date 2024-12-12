import { of } from 'rxjs';
import { stringToJsRegex } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { VariableDependencyConfig } from '../VariableDependencyConfig.js';
import { renderSelectForVariable } from '../components/VariableValueSelect.js';
import { MultiValueVariable } from './MultiValueVariable.js';

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
class DataSourceVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadValues({
      type: "datasource",
      value: "",
      text: "",
      options: [],
      name: "",
      regex: "",
      pluginId: ""
    }, initialState));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["regex"]
    });
  }
  getValueOptions(args) {
    if (!this.state.pluginId) {
      return of([]);
    }
    const dataSources = getDataSourceSrv().getList({ metrics: true, variables: false, pluginId: this.state.pluginId });
    let regex;
    if (this.state.regex) {
      const interpolated = sceneGraph.interpolate(this, this.state.regex, void 0, "regex");
      regex = stringToJsRegex(interpolated);
    }
    const options = [];
    for (let i = 0; i < dataSources.length; i++) {
      const source = dataSources[i];
      if (isValid(source, regex)) {
        options.push({ label: source.name, value: source.uid });
      }
      if (this.state.defaultOptionEnabled && isDefault(source, regex)) {
        options.push({ label: "default", value: "default" });
      }
    }
    if (options.length === 0) {
      this.setState({ error: "No data sources found" });
    } else if (this.state.error) {
      this.setState({ error: null });
    }
    return of(options);
  }
}
DataSourceVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};
function isValid(source, regex) {
  if (!regex) {
    return true;
  }
  return regex.exec(source.name);
}
function isDefault(source, regex) {
  if (!source.isDefault) {
    return false;
  }
  if (!regex) {
    return true;
  }
  return regex.exec("default");
}

export { DataSourceVariable };
//# sourceMappingURL=DataSourceVariable.js.map
