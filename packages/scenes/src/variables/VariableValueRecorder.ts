import { sceneGraph } from '../core/sceneGraph';
import { SceneObject } from '../core/types';
import { SceneVariable, VariableValue } from './types';
import { isVariableValueEqual } from './utils';

/**
 * Useful for remembering variable values to know if they have changed
 **/
export class VariableValueRecorder {
  private _values = new Map<SceneVariable, VariableValue | undefined | null>();

  public recordCurrentDependencyValuesForSceneObject(sceneObject: SceneObject) {
    this.clearValues();

    if (!sceneObject.variableDependency) {
      return;
    }

    for (const variableName of sceneObject.variableDependency.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, sceneObject);
      if (variable) {
        this._values.set(variable, variable.getValue());
      }
    }
  }

  public clearValues() {
    this._values.clear();
  }

  public hasValues(): boolean {
    return !!this._values;
  }

  public recordCurrentValue(variable: SceneVariable) {
    this._values.set(variable, variable.getValue());
  }

  public hasRecordedValue(variable: SceneVariable): boolean {
    return this._values.has(variable);
  }

  public hasValueChanged(variable: SceneVariable): boolean {
    if (this._values.has(variable)) {
      const value = this._values.get(variable);
      if (!isVariableValueEqual(value, variable.getValue())) {
        return true;
      }
    }

    return false;
  }

  public hasDependenciesChanged(sceneObject: SceneObject): boolean {
    if (!this._values) {
      return false;
    }

    if (!sceneObject.variableDependency) {
      return false;
    }

    for (const variableName of sceneObject.variableDependency.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, sceneObject);
      if (variable && this._values.has(variable)) {
        const value = this._values.get(variable);
        if (!isVariableValueEqual(value, variable.getValue())) {
          return true;
        }
      }
    }

    return false;
  }
}
