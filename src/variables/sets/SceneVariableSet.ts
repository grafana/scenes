import { isEqual } from 'lodash';
import { Unsubscribable } from 'rxjs';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObject } from '../../core/types';
import { forEachSceneObjectInState } from '../../core/utils';
import {
  SceneVariable,
  SceneVariables,
  SceneVariableSetState,
  SceneVariableValueChangedEvent,
  VariableValue,
} from '../types';

export class SceneVariableSet extends SceneObjectBase<SceneVariableSetState> implements SceneVariables {
  /** Variables that have changed in since the activation or since the first manual value change */
  private _variablesThatHaveChanged = new Set<SceneVariable>();

  /** Variables that are scheduled to be validated and updated */
  private _variablesToUpdate = new Set<SceneVariable>();

  /** Variables currently updating  */
  private _updating = new Map<SceneVariable, VariableUpdateInProgress>();

  private _validValuesWhenDeactivated: Map<SceneVariable, VariableValue | undefined | null> | undefined;

  public getByName(name: string): SceneVariable | undefined {
    // TODO: Replace with index
    return this.state.variables.find((x) => x.state.name === name);
  }

  /**
   * Subscribes to child variable value changes
   * And starts the variable value validation process
   */
  public activate(): void {
    super.activate();

    // Subscribe to changes to child variables
    this._subs.add(
      this.subscribeToEvent(SceneVariableValueChangedEvent, (event) => this.handleVariableValueChanged(event.payload))
    );

    this.checkForVariablesThatChangedWhileInactive();

    // Add all variables that need updating to queue
    for (const variable of this.state.variables) {
      if (this.variableNeedsUpdate(variable)) {
        this._variablesToUpdate.add(variable);
      }
    }

    this.updateNextBatch();
  }

  /**
   * If variables changed while in in-active state we don't get any change events, so we need to check for that here.
   */
  private checkForVariablesThatChangedWhileInactive() {
    if (!this._validValuesWhenDeactivated) {
      return;
    }

    for (const variable of this.state.variables) {
      if (this._validValuesWhenDeactivated.has(variable)) {
        const value = this._validValuesWhenDeactivated.get(variable);
        if (!isVariableValueEqual(value, variable.getValue())) {
          writeVariableTraceLog(variable, 'Changed while in-active');
          this.handleVariableValueChanged(variable);
        }
      }
    }
  }

  private variableNeedsUpdate(variable: SceneVariable): boolean {
    if (!variable.validateAndUpdate) {
      return false;
    }

    // Check if we have a value from past active state
    if (this._validValuesWhenDeactivated && this._validValuesWhenDeactivated.has(variable)) {
      const value = this._validValuesWhenDeactivated.get(variable);
      // If value the same no need to re-validate it
      if (isVariableValueEqual(value, variable.getValue())) {
        writeVariableTraceLog(variable, 'Skipping updateAndValidate current value valid');
        return false;
      }
    }

    return true;
  }

  /**
   * Cancel all currently running updates
   */
  public deactivate(): void {
    super.deactivate();

    for (const update of this._updating.values()) {
      update.subscription?.unsubscribe();
    }

    // Remember current variable values
    this._validValuesWhenDeactivated = new Map();
    for (const variable of this.state.variables) {
      // if the current variable is not in queue to update and validate and not being actively updated then the value is ok
      if (!this._variablesToUpdate.has(variable) && !this._updating.has(variable)) {
        this._validValuesWhenDeactivated.set(variable, variable.getValue());
      }
    }

    this._variablesToUpdate.clear();
    this._updating.clear();
  }

  /**
   * This loops through variablesToUpdate and update all that that can.
   * If one has a dependency that is currently in variablesToUpdate it will be skipped for now.
   */
  private updateNextBatch() {
    // If we have nothing more to update and variable values changed we need to update scene objects that depend on these variables
    if (this._variablesToUpdate.size === 0) {
      this.notifyDependentSceneObjects();
      return;
    }

    for (const variable of this._variablesToUpdate) {
      if (!variable.validateAndUpdate) {
        throw new Error('Variable added to variablesToUpdate but does not have validateAndUpdate');
      }

      // Ignore it if it's already started
      if (this._updating.has(variable)) {
        continue;
      }

      // Wait for variables that has dependencies that also needs updates
      if (this.hasDependendencyInUpdateQueue(variable)) {
        continue;
      }

      const variableToUpdate: VariableUpdateInProgress = {
        variable,
      };

      this._updating.set(variable, variableToUpdate);
      writeVariableTraceLog(variable, 'updateAndValidate started');

      variableToUpdate.subscription = variable.validateAndUpdate().subscribe({
        next: () => this.validateAndUpdateCompleted(variable),
        error: (err) => this.handleVariableError(variable, err),
      });
    }
  }

  /**
   * A variable has completed it's update process. This could mean that variables that depend on it can now be updated in turn.
   */
  private validateAndUpdateCompleted(variable: SceneVariable) {
    const update = this._updating.get(variable);
    update?.subscription?.unsubscribe();

    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);

    writeVariableTraceLog(variable, 'updateAndValidate completed');

    this.updateNextBatch();
  }

  /**
   * TODO handle this properly (and show error in UI).
   * Not sure if this should be handled here on in MultiValueVariable
   */
  private handleVariableError(variable: SceneVariable, err: Error) {
    const update = this._updating.get(variable);
    update?.subscription?.unsubscribe();

    this._updating.delete(variable);
    this._variablesToUpdate.delete(variable);
    variable.setState({ loading: false, error: err });

    writeVariableTraceLog(variable, 'updateAndValidate error', err);
  }

  /**
   * Checks if the variable has any dependencies that is currently in variablesToUpdate
   */
  private hasDependendencyInUpdateQueue(variable: SceneVariable) {
    if (!variable.variableDependency) {
      return false;
    }

    for (const otherVariable of this._variablesToUpdate.values()) {
      if (variable.variableDependency?.hasDependencyOn(otherVariable.state.name)) {
        return true;
      }
    }

    return false;
  }

  private handleVariableValueChanged(variableThatChanged: SceneVariable) {
    this._variablesThatHaveChanged.add(variableThatChanged);

    // Ignore this change if it is currently updating
    if (this._updating.has(variableThatChanged)) {
      return;
    }

    // Add variables that depend on the changed variable to the update queue
    for (const otherVariable of this.state.variables) {
      if (otherVariable.variableDependency) {
        if (otherVariable.variableDependency.hasDependencyOn(variableThatChanged.state.name)) {
          writeVariableTraceLog(otherVariable, 'Added to update quee, dependant variable value changed');
          this._variablesToUpdate.add(otherVariable);
        }
      }
    }

    this.updateNextBatch();
  }

  /**
   * Walk scene object graph and update all objects that depend on variables that have changed
   */
  private notifyDependentSceneObjects() {
    if (!this.parent) {
      return;
    }

    this.traverseSceneAndNotify(this.parent);
    this._variablesThatHaveChanged.clear();
  }

  /**
   * Recursivly walk the full scene object graph and notify all objects with dependencies that include any of changed variables
   */
  private traverseSceneAndNotify(sceneObject: SceneObject) {
    // No need to notify variables under this SceneVariableSet
    if (this === sceneObject) {
      return;
    }

    if (sceneObject.variableDependency) {
      sceneObject.variableDependency.variableUpdatesCompleted(this._variablesThatHaveChanged);
    }

    forEachSceneObjectInState(sceneObject.state, (child) => this.traverseSceneAndNotify(child));
  }

  /**
   * Return true if variable is waiting to update or currently updating
   */
  public isVariableLoadingOrWaitingToUpdate(variable: SceneVariable) {
    // If we have not activated yet then variables are not up to date
    if (!this.isActive) {
      return true;
    }

    return this._variablesToUpdate.has(variable) || this._updating.has(variable);
  }
}

export interface VariableUpdateInProgress {
  variable: SceneVariable;
  subscription?: Unsubscribable;
}

function writeVariableTraceLog(variable: SceneVariable, message: string, err?: Error) {
  if ((window as any).grafanaLoggingSceneVariables) {
    console.log(`Variable[${variable.state.name}]: ${message}`, err ?? '');
  }
}

function isVariableValueEqual(a: VariableValue | null | undefined, b: VariableValue | null | undefined) {
  if (a === b) {
    return true;
  }

  return isEqual(a, b);
}
