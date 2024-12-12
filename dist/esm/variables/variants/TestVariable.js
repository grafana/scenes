import { Subject, Observable } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { queryMetricTree } from '../../utils/metricTree.js';
import { VariableDependencyConfig } from '../VariableDependencyConfig.js';
import { renderSelectForVariable } from '../components/VariableValueSelect.js';
import { MultiValueVariable } from './MultiValueVariable.js';
import { VariableRefresh } from '@grafana/data';
import { getClosest } from '../../core/sceneGraph/utils.js';
import { SceneVariableSet } from '../sets/SceneVariableSet.js';

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
class TestVariable extends MultiValueVariable {
  constructor(initialState, isLazy = false) {
    super(__spreadValues({
      type: "custom",
      name: "Test",
      value: "Value",
      text: "Text",
      query: "Query",
      options: [],
      refresh: VariableRefresh.onDashboardLoad,
      updateOptions: true
    }, initialState));
    this.completeUpdate = new Subject();
    this.isGettingValues = true;
    this.getValueOptionsCount = 0;
    this.isLazy = false;
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["query"]
    });
    this.isLazy = isLazy;
  }
  getValueOptions(args) {
    const { delayMs } = this.state;
    this.getValueOptionsCount += 1;
    const queryController = sceneGraph.getQueryController(this);
    return new Observable((observer) => {
      const queryEntry = {
        type: "variable",
        origin: this,
        cancel: () => observer.complete()
      };
      if (queryController) {
        queryController.queryStarted(queryEntry);
      }
      this.setState({ loading: true });
      if (this.state.throwError) {
        throw new Error(this.state.throwError);
      }
      const interpolatedQuery = sceneGraph.interpolate(this, this.state.query);
      const options = this.getOptions(interpolatedQuery);
      const sub = this.completeUpdate.subscribe({
        next: () => {
          const newState = { issuedQuery: interpolatedQuery, loading: false };
          if (this.state.updateOptions) {
            newState.options = options;
          }
          this.setState(newState);
          observer.next(options);
          observer.complete();
        }
      });
      let timeout;
      if (delayMs) {
        timeout = window.setTimeout(() => this.signalUpdateCompleted(), delayMs);
      } else if (delayMs === 0) {
        this.signalUpdateCompleted();
      }
      this.isGettingValues = true;
      return () => {
        sub.unsubscribe();
        window.clearTimeout(timeout);
        this.isGettingValues = false;
        if (this.state.loading) {
          this.setState({ loading: false });
        }
        if (queryController) {
          queryController.queryCompleted(queryEntry);
        }
      };
    });
  }
  cancel() {
    const sceneVarSet = getClosest(this, (s) => s instanceof SceneVariableSet ? s : void 0);
    sceneVarSet == null ? void 0 : sceneVarSet.cancel(this);
  }
  getOptions(interpolatedQuery) {
    if (this.state.optionsToReturn) {
      return this.state.optionsToReturn;
    }
    return queryMetricTree(interpolatedQuery).map((x) => ({ label: x.name, value: x.name }));
  }
  signalUpdateCompleted() {
    this.completeUpdate.next(1);
  }
}
TestVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};

export { TestVariable };
//# sourceMappingURL=TestVariable.js.map
