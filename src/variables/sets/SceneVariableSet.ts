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

  private _valuesWhenDeactivated: Map<string, VariableValue | undefined | null> | undefined;

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

    this.checkIfVariableValuesChangedWhileDeactivated();

    // Subscribe to changes to child variables
    this._subs.add(this.subscribeToEvent(SceneVariableValueChangedEvent, this.onVariableValueChanged));
    this.validateAndUpdateAll();
  }

  /**
   * Cancel all currently running updates
   */
  public deactivate(): void {
    super.deactivate();

    for (const update of this._updating.values()) {
      update.subscription?.unsubscribe();
    }

    this._variablesToUpdate.clear();
    this._updating.clear();
    this._variablesThatHaveChanged.clear();

    // Remember current variable values
    this._valuesWhenDeactivated = new Map();
    for (const variable of this.state.variables) {
      this._valuesWhenDeactivated.set(variable.state.name, variable.getValue());
    }
  }

  /**
   * This loops through variablesToUpdate and update all that that can.
   * If one has a dependency that is currently in variablesToUpdate it will be skipped for now.
   */
  private updateNextBatch() {
    // If we have nothing more to update and variable values changed we need to update scene objects that depend on these variables
    if (this._variablesToUpdate.size === 0 && this._variablesThatHaveChanged.size > 0) {
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
      variableToUpdate.subscription = variable.validateAndUpdate().subscribe({
        next: () => this.validateAndUpdateCompleted(variable),
        error: (err) => this.handleVariableError(variable, err),
      });
    }
  }

  /**
   * Values can change while deactivated via for example URL sync or manual changes.
   */
  private checkIfVariableValuesChangedWhileDeactivated() {
    if (this._valuesWhenDeactivated) {
      for (const variable of this.state.variables) {
        const valueWhenDeactivated = this._valuesWhenDeactivated.get(variable.state.name);
        if (valueWhenDeactivated !== variable.getValue()) {
          this._variablesThatHaveChanged.add(variable);
        }
      }

      this._valuesWhenDeactivated = undefined;
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

  /**
   * Extract dependencies from all variables and add those that needs update to the variablesToUpdate map
   * Then it will start the update process.
   */
  private validateAndUpdateAll() {
    for (const variable of this.state.variables) {
      if (variable.validateAndUpdate) {
        this._variablesToUpdate.add(variable);
      }
    }

    this.updateNextBatch();
  }

  /**
   * This will trigger an update of all variables that depend on it.
   * */
  private onVariableValueChanged = (event: SceneVariableValueChangedEvent) => {
    const variableThatChanged = event.payload;

    this._variablesThatHaveChanged.add(variableThatChanged);

    // Ignore this change if it is currently updating
    if (this._updating.has(variableThatChanged)) {
      return;
    }

    // Add variables that depend on the changed variable to the update queue
    for (const otherVariable of this.state.variables) {
      if (otherVariable.variableDependency) {
        if (otherVariable.variableDependency.hasDependencyOn(variableThatChanged.state.name)) {
          this._variablesToUpdate.add(otherVariable);
        }
      }
    }

    this.updateNextBatch();
  };

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
      sceneObject.variableDependency.variableValuesChanged(this._variablesThatHaveChanged);
    }

    forEachSceneObjectInState(sceneObject.state, (child) => this.traverseSceneAndNotify(child));
  }
}

export interface VariableUpdateInProgress {
  variable: SceneVariable;
  subscription?: Unsubscribable;
}
