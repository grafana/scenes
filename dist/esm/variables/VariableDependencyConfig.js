import { DataLinkBuiltInVars } from '@grafana/data';
import { sceneGraph } from '../core/sceneGraph/index.js';
import { writeSceneLog } from '../utils/writeSceneLog.js';
import { VARIABLE_REGEX } from './constants.js';
import { safeStringifyValue } from './utils.js';

class VariableDependencyConfig {
  constructor(_sceneObject, _options) {
    this._sceneObject = _sceneObject;
    this._options = _options;
    this._dependencies = /* @__PURE__ */ new Set();
    this._isWaitingForVariables = false;
    this.scanCount = 0;
    this._statePaths = _options.statePaths;
  }
  hasDependencyOn(name) {
    return this.getNames().has(name);
  }
  variableUpdateCompleted(variable, hasChanged) {
    const deps = this.getNames();
    let dependencyChanged = false;
    if ((deps.has(variable.state.name) || deps.has(DataLinkBuiltInVars.includeVars)) && hasChanged) {
      dependencyChanged = true;
    }
    writeSceneLog(
      "VariableDependencyConfig",
      "variableUpdateCompleted",
      variable.state.name,
      dependencyChanged,
      this._isWaitingForVariables
    );
    if (this._options.onAnyVariableChanged) {
      this._options.onAnyVariableChanged(variable);
    }
    if (this._options.onVariableUpdateCompleted && (this._isWaitingForVariables || dependencyChanged)) {
      this._options.onVariableUpdateCompleted();
    }
    if (dependencyChanged) {
      if (this._options.onReferencedVariableValueChanged) {
        this._options.onReferencedVariableValueChanged(variable);
      }
      if (!this._options.onReferencedVariableValueChanged && !this._options.onVariableUpdateCompleted) {
        this._sceneObject.forceRender();
      }
    }
  }
  hasDependencyInLoadingState() {
    if (sceneGraph.hasVariableDependencyInLoadingState(this._sceneObject)) {
      this._isWaitingForVariables = true;
      return true;
    }
    this._isWaitingForVariables = false;
    return false;
  }
  getNames() {
    const prevState = this._state;
    const newState = this._state = this._sceneObject.state;
    if (!prevState) {
      this.scanStateForDependencies(this._state);
      return this._dependencies;
    }
    if (newState !== prevState) {
      if (this._statePaths) {
        for (const path of this._statePaths) {
          if (path === "*" || newState[path] !== prevState[path]) {
            this.scanStateForDependencies(newState);
            break;
          }
        }
      } else {
        this.scanStateForDependencies(newState);
      }
    }
    return this._dependencies;
  }
  setVariableNames(varNames) {
    this._options.variableNames = varNames;
    this.scanStateForDependencies(this._state);
  }
  setPaths(paths) {
    this._statePaths = paths;
  }
  scanStateForDependencies(state) {
    this._dependencies.clear();
    this.scanCount += 1;
    if (this._options.variableNames) {
      for (const name of this._options.variableNames) {
        this._dependencies.add(name);
      }
    }
    if (this._statePaths) {
      for (const path of this._statePaths) {
        if (path === "*") {
          this.extractVariablesFrom(state);
          break;
        } else {
          const value = state[path];
          if (value) {
            this.extractVariablesFrom(value);
          }
        }
      }
    }
  }
  extractVariablesFrom(value) {
    VARIABLE_REGEX.lastIndex = 0;
    const stringToCheck = typeof value !== "string" ? safeStringifyValue(value) : value;
    const matches = stringToCheck.matchAll(VARIABLE_REGEX);
    if (!matches) {
      return;
    }
    for (const match of matches) {
      const [, var1, var2, , var3] = match;
      const variableName = var1 || var2 || var3;
      this._dependencies.add(variableName);
    }
  }
}

export { VariableDependencyConfig };
//# sourceMappingURL=VariableDependencyConfig.js.map
