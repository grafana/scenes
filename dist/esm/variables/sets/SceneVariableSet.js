import { VariableRefresh } from '@grafana/data';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { writeSceneLog } from '../../utils/writeSceneLog.js';
import { SceneVariableValueChangedEvent } from '../types.js';
import { VariableValueRecorder } from '../VariableValueRecorder.js';

class SceneVariableSet extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._variablesThatHaveChanged = /* @__PURE__ */ new Set();
    this._variablesToUpdate = /* @__PURE__ */ new Set();
    this._updating = /* @__PURE__ */ new Map();
    this._variableValueRecorder = new VariableValueRecorder();
    this._variableDependency = new SceneVariableSetVariableDependencyHandler(
      this._handleParentVariableUpdatesCompleted.bind(this)
    );
    this._onActivate = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      this._subs.add(
        this.subscribeToEvent(SceneVariableValueChangedEvent, (event) => this._handleVariableValueChanged(event.payload))
      );
      this._subs.add(
        timeRange.subscribeToState(() => {
          this._refreshTimeRangeBasedVariables();
        })
      );
      this._subs.add(this.subscribeToState(this._onStateChanged));
      this._checkForVariablesThatChangedWhileInactive();
      for (const variable of this.state.variables) {
        if (this._variableNeedsUpdate(variable)) {
          this._variablesToUpdate.add(variable);
        }
      }
      this._updateNextBatch();
      return this._onDeactivate;
    };
    this._onDeactivate = () => {
      var _a;
      for (const update of this._updating.values()) {
        (_a = update.subscription) == null ? void 0 : _a.unsubscribe();
      }
      for (const variable of this.state.variables) {
        if (!this._variablesToUpdate.has(variable) && !this._updating.has(variable)) {
          this._variableValueRecorder.recordCurrentValue(variable);
        }
      }
      this._variablesToUpdate.clear();
      this._updating.clear();
    };
    this._onStateChanged = (newState, oldState) => {
      const variablesToUpdateCountStart = this._variablesToUpdate.size;
      for (const variable of oldState.variables) {
        if (!newState.variables.includes(variable)) {
          const updating = this._updating.get(variable);
          if (updating == null ? void 0 : updating.subscription) {
            updating.subscription.unsubscribe();
          }
          this._updating.delete(variable);
          this._variablesToUpdate.delete(variable);
        }
      }
      for (const variable of newState.variables) {
        if (!oldState.variables.includes(variable)) {
          if (this._variableNeedsUpdate(variable)) {
            this._variablesToUpdate.add(variable);
          }
        }
      }
      if (variablesToUpdateCountStart === 0 && this._variablesToUpdate.size > 0) {
        this._updateNextBatch();
      }
    };
    this.addActivationHandler(this._onActivate);
  }
  getByName(name) {
    return this.state.variables.find((x) => x.state.name === name);
  }
  _refreshTimeRangeBasedVariables() {
    for (const variable of this.state.variables) {
      if ("refresh" in variable.state && variable.state.refresh === VariableRefresh.onTimeRangeChanged) {
        this._variablesToUpdate.add(variable);
      }
    }
    this._updateNextBatch();
  }
  _checkForVariablesThatChangedWhileInactive() {
    if (!this._variableValueRecorder.hasValues()) {
      return;
    }
    for (const variable of this.state.variables) {
      if (this._variableValueRecorder.hasValueChanged(variable)) {
        writeVariableTraceLog(variable, "Changed while in-active");
        this._addDependentVariablesToUpdateQueue(variable);
      }
    }
  }
  _variableNeedsUpdate(variable) {
    if (variable.isLazy) {
      return false;
    }
    if (!variable.validateAndUpdate) {
      return false;
    }
    if (this._variableValueRecorder.hasRecordedValue(variable)) {
      writeVariableTraceLog(variable, "Skipping updateAndValidate current value valid");
      return false;
    }
    return true;
  }
  _updateNextBatch() {
    for (const variable of this._variablesToUpdate) {
      if (!variable.validateAndUpdate) {
        throw new Error("Variable added to variablesToUpdate but does not have validateAndUpdate");
      }
      if (this._updating.has(variable)) {
        continue;
      }
      if (sceneGraph.hasVariableDependencyInLoadingState(variable)) {
        continue;
      }
      const variableToUpdate = {
        variable
      };
      this._updating.set(variable, variableToUpdate);
      writeVariableTraceLog(variable, "updateAndValidate started");
      variableToUpdate.subscription = variable.validateAndUpdate().subscribe({
        next: () => this._validateAndUpdateCompleted(variable),
        complete: () => this._validateAndUpdateCompleted(variable),
        error: (err) => this._handleVariableError(variable, err)
      });
    }
  }
  _validateAndUpdateCompleted(variable) {
    var _a;
    if (!this._updating.has(variable)) {
      return;
    }
    const update = this._updating.get(variable);
    (_a = update == null ? void 0 : update.subscription) == null ? void 0 : _a.unsubscribe();
    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
    writeVariableTraceLog(variable, "updateAndValidate completed");
    this._notifyDependentSceneObjects(variable);
    this._updateNextBatch();
  }
  cancel(variable) {
    var _a;
    const update = this._updating.get(variable);
    (_a = update == null ? void 0 : update.subscription) == null ? void 0 : _a.unsubscribe();
    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
  }
  _handleVariableError(variable, err) {
    var _a;
    const update = this._updating.get(variable);
    (_a = update == null ? void 0 : update.subscription) == null ? void 0 : _a.unsubscribe();
    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
    variable.setState({ loading: false, error: err.message });
    console.error("SceneVariableSet updateAndValidate error", err);
    writeVariableTraceLog(variable, "updateAndValidate error", err);
    this._notifyDependentSceneObjects(variable);
    this._updateNextBatch();
  }
  _handleVariableValueChanged(variableThatChanged) {
    this._variablesThatHaveChanged.add(variableThatChanged);
    this._addDependentVariablesToUpdateQueue(variableThatChanged);
    if (!this._updating.has(variableThatChanged)) {
      this._updateNextBatch();
      this._notifyDependentSceneObjects(variableThatChanged);
    }
  }
  _handleParentVariableUpdatesCompleted(variable, hasChanged) {
    if (hasChanged) {
      this._addDependentVariablesToUpdateQueue(variable);
    }
    if (this._variablesToUpdate.size > 0 && this._updating.size === 0) {
      this._updateNextBatch();
    }
  }
  _addDependentVariablesToUpdateQueue(variableThatChanged) {
    for (const otherVariable of this.state.variables) {
      if (otherVariable.variableDependency) {
        if (otherVariable.variableDependency.hasDependencyOn(variableThatChanged.state.name)) {
          writeVariableTraceLog(otherVariable, "Added to update queue, dependant variable value changed");
          if (this._updating.has(otherVariable) && otherVariable.onCancel) {
            otherVariable.onCancel();
          }
          this._variablesToUpdate.add(otherVariable);
        }
      }
    }
  }
  _notifyDependentSceneObjects(variable) {
    if (!this.parent) {
      return;
    }
    this._traverseSceneAndNotify(this.parent, variable, this._variablesThatHaveChanged.has(variable));
    this._variablesThatHaveChanged.delete(variable);
  }
  _traverseSceneAndNotify(sceneObject, variable, hasChanged) {
    if (this === sceneObject) {
      return;
    }
    if (!sceneObject.isActive) {
      return;
    }
    if (sceneObject.state.$variables && sceneObject.state.$variables !== this) {
      const localVar = sceneObject.state.$variables.getByName(variable.state.name);
      if (localVar) {
        return;
      }
    }
    if (sceneObject.variableDependency) {
      sceneObject.variableDependency.variableUpdateCompleted(variable, hasChanged);
    }
    sceneObject.forEachChild((child) => this._traverseSceneAndNotify(child, variable, hasChanged));
  }
  isVariableLoadingOrWaitingToUpdate(variable) {
    if (variable.isAncestorLoading && variable.isAncestorLoading()) {
      return true;
    }
    if (this._variablesToUpdate.has(variable) || this._updating.has(variable)) {
      return true;
    }
    return sceneGraph.hasVariableDependencyInLoadingState(variable);
  }
}
function writeVariableTraceLog(variable, message, err) {
  if (err) {
    writeSceneLog("SceneVariableSet", `Variable[${variable.state.name}]: ${message}`, err);
  } else {
    writeSceneLog("SceneVariableSet", `Variable[${variable.state.name}]: ${message}`);
  }
}
class SceneVariableSetVariableDependencyHandler {
  constructor(_variableUpdatesCompleted) {
    this._variableUpdatesCompleted = _variableUpdatesCompleted;
    this._emptySet = /* @__PURE__ */ new Set();
  }
  getNames() {
    return this._emptySet;
  }
  hasDependencyOn(name) {
    return false;
  }
  variableUpdateCompleted(variable, hasChanged) {
    this._variableUpdatesCompleted(variable, hasChanged);
  }
}

export { SceneVariableSet };
//# sourceMappingURL=SceneVariableSet.js.map
