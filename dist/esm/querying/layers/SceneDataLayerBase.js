import { ReplaySubject } from 'rxjs';
import { emptyPanelData } from '../../core/SceneDataNode.js';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { setBaseClassState } from '../../utils/utils.js';
import { writeSceneLog } from '../../utils/writeSceneLog.js';
import { VariableDependencyConfig } from '../../variables/VariableDependencyConfig.js';
import { VariableValueRecorder } from '../../variables/VariableValueRecorder.js';

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
class SceneDataLayerBase extends SceneObjectBase {
  constructor(initialState, variableDependencyStatePaths = []) {
    super(__spreadValues({
      isEnabled: true
    }, initialState));
    this._results = new ReplaySubject(1);
    this.isDataLayer = true;
    this._variableValueRecorder = new VariableValueRecorder();
    this._variableDependency = new VariableDependencyConfig(this, {
      onVariableUpdateCompleted: this.onVariableUpdateCompleted.bind(this)
    });
    this._variableDependency.setPaths(variableDependencyStatePaths);
    this.addActivationHandler(() => this.onActivate());
  }
  onActivate() {
    if (this.state.isEnabled) {
      this.onEnable();
    }
    if (this.shouldRunLayerOnActivate()) {
      this.runLayer();
    }
    this.subscribeToState((n, p) => {
      if (!n.isEnabled && this.querySub) {
        this.querySub.unsubscribe();
        this.querySub = void 0;
        this.onDisable();
        this._results.next({ origin: this, data: emptyPanelData });
        this.setStateHelper({ data: emptyPanelData });
      }
      if (n.isEnabled && !p.isEnabled) {
        this.onEnable();
        this.runLayer();
      }
    });
    return () => {
      this.onDeactivate();
    };
  }
  onDeactivate() {
    if (this.querySub) {
      this.querySub.unsubscribe();
      this.querySub = void 0;
    }
    this.onDisable();
    this._variableValueRecorder.recordCurrentDependencyValuesForSceneObject(this);
  }
  onVariableUpdateCompleted() {
    this.runLayer();
  }
  cancelQuery() {
    if (this.querySub) {
      this.querySub.unsubscribe();
      this.querySub = void 0;
      this.publishResults(emptyPanelData);
    }
  }
  publishResults(data) {
    if (this.state.isEnabled) {
      this._results.next({ origin: this, data });
      this.setStateHelper({ data });
    }
  }
  getResultsStream() {
    return this._results;
  }
  shouldRunLayerOnActivate() {
    if (!this.state.isEnabled) {
      return false;
    }
    if (this._variableValueRecorder.hasDependenciesChanged(this)) {
      writeSceneLog(
        "SceneDataLayerBase",
        "Variable dependency changed while inactive, shouldRunLayerOnActivate returns true"
      );
      return true;
    }
    if (!this.state.data) {
      return true;
    }
    return false;
  }
  setStateHelper(state) {
    setBaseClassState(this, state);
  }
}

export { SceneDataLayerBase };
//# sourceMappingURL=SceneDataLayerBase.js.map
