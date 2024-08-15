import { sceneGraph } from '../core/sceneGraph';
import { SceneObject } from '../core/types';
import { SceneVariable, VariableValue } from './types';
import { isVariableValueEqual } from './utils';

/**
 * Useful for remembering variable values to know if they have changed
 **/
export class VariableValueRecorder {
  private _values = new Map<string, VariableValue | undefined | null>();

  public recordCurrentDependencyValuesForSceneObject(sceneObject: SceneObject) {
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

  public cloneAndRecordCurrentValuesForSceneObject(sceneObject: SceneObject) {
    const clone = new VariableValueRecorder();
    clone.recordCurrentDependencyValuesForSceneObject(sceneObject);
    return clone;
  }

  public clearValues() {
    this._values.clear();
  }

  public hasValues(): boolean {
    return !!this._values;
  }

  public recordCurrentValue(variable: SceneVariable) {
    this._values.set(variable.state.name, variable.getValue());
  }

  public hasRecordedValue(variable: SceneVariable): boolean {
    return this._values.has(variable.state.name);
  }

  public hasValueChanged(variable: SceneVariable): boolean {
    if (this._values.has(variable.state.name)) {
      const value = this._values.get(variable.state.name);
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
