import { sceneGraph } from '../core/sceneGraph/index.js';
import { isVariableValueEqual } from './utils.js';

class VariableValueRecorder {
  constructor() {
    this._values = /* @__PURE__ */ new Map();
  }
  recordCurrentDependencyValuesForSceneObject(sceneObject) {
    this.clearValues();
    if (!sceneObject.variableDependency) {
      return;
    }
    for (const variableName of sceneObject.variableDependency.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, sceneObject);
      if (variable) {
        this._values.set(variable.state.name, variable.getValue());
      }
    }
  }
  cloneAndRecordCurrentValuesForSceneObject(sceneObject) {
    const clone = new VariableValueRecorder();
    clone.recordCurrentDependencyValuesForSceneObject(sceneObject);
    return clone;
  }
  clearValues() {
    this._values.clear();
  }
  hasValues() {
    return !!this._values;
  }
  recordCurrentValue(variable) {
    this._values.set(variable.state.name, variable.getValue());
  }
  hasRecordedValue(variable) {
    return this._values.has(variable.state.name);
  }
  hasValueChanged(variable) {
    if (this._values.has(variable.state.name)) {
      const value = this._values.get(variable.state.name);
      if (!isVariableValueEqual(value, variable.getValue())) {
        return true;
      }
    }
    return false;
  }
  hasDependenciesChanged(sceneObject) {
    if (!this._values) {
      return false;
    }
    if (!sceneObject.variableDependency) {
      return false;
    }
    for (const variableName of sceneObject.variableDependency.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, sceneObject);
      if (!variable) {
        continue;
      }
      const name = variable.state.name;
      if (variable && this._values.has(name)) {
        const value = this._values.get(name);
        if (!isVariableValueEqual(value, variable.getValue())) {
          return true;
        }
      }
    }
    return false;
  }
}

export { VariableValueRecorder };
//# sourceMappingURL=VariableValueRecorder.js.map
