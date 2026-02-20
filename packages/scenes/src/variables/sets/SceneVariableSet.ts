import { VariableRefresh } from '@grafana/data';
import { Unsubscribable } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObject } from '../../core/types';
import { writeSceneLog } from '../../utils/writeSceneLog';
import {
  SceneVariable,
  SceneVariableDependencyConfigLike,
  SceneVariables,
  SceneVariableSetState,
  SceneVariableValueChangedEvent,
} from '../types';
import { VariableValueRecorder } from '../VariableValueRecorder';

export class SceneVariableSet extends SceneObjectBase<SceneVariableSetState> implements SceneVariables {
  /** Variables that are scheduled to be validated and updated */
  private _variablesToUpdate = new Set<SceneVariable>();

  /** Variables currently updating  */
  private _updating = new Map<SceneVariable, VariableUpdateInProgress>();

  private _variableValueRecorder = new VariableValueRecorder();

  /**
   * This makes sure SceneVariableSet's higher up in the chain notify us when parent level variables complete update batches.
   **/
  protected _variableDependency = new SceneVariableSetVariableDependencyHandler(
    this._handleParentVariableUpdatesCompleted.bind(this)
  );

  public getByName(name: string): SceneVariable | undefined {
    // TODO: Replace with index
    return this.state.variables.find((x) => x.state.name === name);
  }

  public constructor(state: SceneVariableSetState) {
    super(state);

    this.addActivationHandler(this._onActivate);
  }

  /**
   * Subscribes to child variable value changes, and starts the variable value validation process
   */
  private _onActivate = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    // Subscribe to changes to child variables
    this._subs.add(
      this.subscribeToEvent(SceneVariableValueChangedEvent, (event) => this._handleVariableValueChanged(event.payload))
    );

    this._subs.add(
      timeRange.subscribeToState(() => {
        this._refreshTimeRangeBasedVariables();
      })
    );

    // Subscribe to state changes
    this._subs.add(this.subscribeToState(this._onStateChanged));

    this._checkForVariablesThatChangedWhileInactive();

    // Add all variables that need updating to queue
    for (const variable of this.state.variables) {
      if (this._variableNeedsUpdate(variable)) {
        this._variablesToUpdate.add(variable);
      }
    }

    this._updateNextBatch();

    // Return deactivation handler;
    return this._onDeactivate;
  };

  /**
   * Add all variables that depend on the changed variable to the update queue
   */
  private _refreshTimeRangeBasedVariables() {
    for (const variable of this.state.variables) {
      if ('refresh' in variable.state && variable.state.refresh === VariableRefresh.onTimeRangeChanged) {
        this._variablesToUpdate.add(variable);
      }
    }
    this._updateNextBatch();
  }

  /**
   * Cancel all currently running updates
   */
  private _onDeactivate = () => {
    for (const update of this._updating.values()) {
      update.subscription?.unsubscribe();
    }

    // Remember current variable values
    for (const variable of this.state.variables) {
      // if the current variable is not in queue to update and validate and not being actively updated then the value is ok
      if (!this._variablesToUpdate.has(variable) && !this._updating.has(variable)) {
        this._variableValueRecorder.recordCurrentValue(variable);
      }
    }

    this._variablesToUpdate.clear();
    this._updating.clear();
  };

  /**
   * Look for new variables that need to be initialized
   */
  private _onStateChanged = (newState: SceneVariableSetState, oldState: SceneVariableSetState) => {
    const variablesToUpdateCountStart = this._variablesToUpdate.size;

    // Check for removed variables
    for (const variable of oldState.variables) {
      if (!newState.variables.includes(variable)) {
        const updating = this._updating.get(variable);
        if (updating?.subscription) {
          updating.subscription.unsubscribe();
        }
        this._updating.delete(variable);
        this._variablesToUpdate.delete(variable);
      }
    }

    // Check for new variables
    for (const variable of newState.variables) {
      if (!oldState.variables.includes(variable)) {
        if (this._variableNeedsUpdate(variable)) {
          this._variablesToUpdate.add(variable);
        }
      }
    }

    // Only start a new batch if there was no batch already running
    if (variablesToUpdateCountStart === 0 && this._variablesToUpdate.size > 0) {
      this._updateNextBatch();
    }
  };

  /**
   * If variables changed while in in-active state we don't get any change events, so we need to check for that here.
   */
  private _checkForVariablesThatChangedWhileInactive() {
    if (!this._variableValueRecorder.hasValues()) {
      return;
    }

    for (const variable of this.state.variables) {
      if (this._variableValueRecorder.hasValueChanged(variable)) {
        writeVariableTraceLog(variable, 'Changed while in-active');
        this._addDependentVariablesToUpdateQueue(variable);
      }
    }
  }

  private _variableNeedsUpdate(variable: SceneVariable): boolean {
    if (variable.isLazy) {
      return false;
    }

    if (!variable.validateAndUpdate) {
      return false;
    }

    // If we have recorded valid value (even if it has changed since we do not need to re-validate this variable)
    if (this._variableValueRecorder.hasRecordedValue(variable)) {
      writeVariableTraceLog(variable, 'Skipping updateAndValidate current value valid');
      return false;
    }

    return true;
  }

  /**
   * This loops through variablesToUpdate and update all that can.
   * If one has a dependency that is currently in variablesToUpdate it will be skipped for now.
   */
  private _updateNextBatch() {
    for (const variable of this._variablesToUpdate) {
      if (!variable.validateAndUpdate) {
        console.error('Variable added to variablesToUpdate but does not have validateAndUpdate');
        continue;
      }

      // Ignore it if it's already started
      if (this._updating.has(variable)) {
        continue;
      }

      // Wait for variables that has dependencies that also needs updates
      if (sceneGraph.hasVariableDependencyInLoadingState(variable)) {
        continue;
      }

      const variableToUpdate: VariableUpdateInProgress = {
        variable,
      };

      this._updating.set(variable, variableToUpdate);
      writeVariableTraceLog(variable, 'updateAndValidate started');

      variableToUpdate.subscription = variable.validateAndUpdate().subscribe({
        next: () => this._validateAndUpdateCompleted(variable),
        complete: () => this._validateAndUpdateCompleted(variable),
        error: (err) => this._handleVariableError(variable, err),
      });
    }
  }

  /**
   * A variable has completed its update process. This could mean that variables that depend on it can now be updated in turn.
   */
  private _validateAndUpdateCompleted(variable: SceneVariable) {
    if (!this._updating.has(variable)) {
      return;
    }

    const update = this._updating.get(variable);
    update?.subscription?.unsubscribe();

    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);

    writeVariableTraceLog(variable, 'updateAndValidate completed');

    this._notifyDependentSceneObjects(variable);
    this._updateNextBatch();
  }

  public cancel(variable: SceneVariable) {
    const update = this._updating.get(variable);
    update?.subscription?.unsubscribe();

    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
  }

  private _handleVariableError(variable: SceneVariable, err: Error) {
    const update = this._updating.get(variable);
    update?.subscription?.unsubscribe();

    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);

    variable.setState({ loading: false, error: err.message });

    console.error('SceneVariableSet updateAndValidate error', err);

    writeVariableTraceLog(variable, 'updateAndValidate error', err);

    this._notifyDependentSceneObjects(variable);
    this._updateNextBatch();
  }

  private _handleVariableValueChanged(variableThatChanged: SceneVariable) {
    this._addDependentVariablesToUpdateQueue(variableThatChanged);

    // Ignore this change if it is currently updating
    if (!this._updating.has(variableThatChanged)) {
      this._updateNextBatch();
      this._notifyDependentSceneObjects(variableThatChanged);
    }
  }

  /**
   * This is called by any parent level variable set to notify scene that an update batch is completed.
   * This is the main mechanism lower level variable set's react to changes on higher levels.
   */
  private _handleParentVariableUpdatesCompleted(variable: SceneVariable, hasChanged: boolean) {
    // First loop through changed variables and add any of our variables that depend on the higher level variable to the update queue
    if (hasChanged) {
      this._addDependentVariablesToUpdateQueue(variable);
    }

    // If we have variables to update but none are currently updating kick of a new update batch
    if (this._variablesToUpdate.size > 0 && this._updating.size === 0) {
      this._updateNextBatch();
    }
  }

  private _addDependentVariablesToUpdateQueue(variableThatChanged: SceneVariable) {
    for (const otherVariable of this.state.variables) {
      if (otherVariable.variableDependency) {
        if (otherVariable.variableDependency.hasDependencyOn(variableThatChanged.state.name)) {
          writeVariableTraceLog(otherVariable, 'Added to update queue, dependant variable value changed');

          if (this._updating.has(otherVariable) && otherVariable.onCancel) {
            otherVariable.onCancel();
          }

          if (otherVariable.validateAndUpdate) {
            this._variablesToUpdate.add(otherVariable);
          }

          // Because _traverseSceneAndNotify skips itself (and this sets variables) we call this here to notify the variable of the change
          otherVariable.variableDependency.variableUpdateCompleted(variableThatChanged, true);
        }
      }
    }
  }

  /**
   * Walk scene object graph and update all objects that depend on variables that have changed
   */
  private _notifyDependentSceneObjects(variable: SceneVariable) {
    if (!this.parent) {
      return;
    }

    this._traverseSceneAndNotify(this.parent, variable, true);
  }

  /**
   * Recursivly walk the full scene object graph and notify all objects with dependencies that include any of changed variables
   */
  private _traverseSceneAndNotify(sceneObject: SceneObject, variable: SceneVariable, hasChanged: boolean) {
    // No need to notify variables under this SceneVariableSet
    if (this === sceneObject) {
      return;
    }

    // Skip non active scene objects
    if (!sceneObject.isActive) {
      return;
    }

    // If we find a nested SceneVariableSet that has a variable with the same name we stop the traversal
    if (sceneObject.state.$variables && sceneObject.state.$variables !== this) {
      const localVar = sceneObject.state.$variables.getByName(variable.state.name);
      // If local variable is viewed as loading when ancestor is loading we propagate a change
      if (localVar?.isAncestorLoading) {
        variable = localVar;
      } else if (localVar) {
        return;
      }
    }

    if (sceneObject.variableDependency) {
      sceneObject.variableDependency.variableUpdateCompleted(variable, hasChanged);
    }

    sceneObject.forEachChild((child) => this._traverseSceneAndNotify(child, variable, hasChanged));
  }

  /**
   * Return true if variable is waiting to update or currently updating.
   * It also returns true if a dependency of the variable is loading.
   *
   * For example if C depends on variable B which depends on variable A and A is loading this returns true for variable C and B.
   */
  public isVariableLoadingOrWaitingToUpdate(variable: SceneVariable) {
    // If we are not active yet we have not initialized variables so we should treat them as loading
    if (!this.isActive) {
      return true;
    }

    if (variable.state.loading) {
      return true;
    }

    if (variable.isAncestorLoading && variable.isAncestorLoading()) {
      return true;
    }

    if (this._variablesToUpdate.has(variable) || this._updating.has(variable)) {
      return true;
    }

    // Last scenario is to check the variable's own dependencies as well
    return sceneGraph.hasVariableDependencyInLoadingState(variable);
  }
}

export interface VariableUpdateInProgress {
  variable: SceneVariable;
  subscription?: Unsubscribable;
}

function writeVariableTraceLog(variable: SceneVariable, message: string, err?: Error) {
  if (err) {
    writeSceneLog('SceneVariableSet', `Variable[${variable.state.name}]: ${message}`, err);
  } else {
    writeSceneLog('SceneVariableSet', `Variable[${variable.state.name}]: ${message}`);
  }
}

class SceneVariableSetVariableDependencyHandler implements SceneVariableDependencyConfigLike {
  public constructor(private _variableUpdatesCompleted: (variable: SceneVariable, hasChanged: boolean) => void) {}

  private _emptySet = new Set<string>();

  public getNames(): Set<string> {
    return this._emptySet;
  }

  public hasDependencyOn(name: string): boolean {
    return false;
  }

  public variableUpdateCompleted(variable: SceneVariable, hasChanged: boolean): void {
    this._variableUpdatesCompleted(variable, hasChanged);
  }
}
