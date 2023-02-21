import { sceneGraph } from '../core/sceneGraph';
import { SceneObject } from '../core/types';
import { SceneVariable, VariableValue } from './types';
import { isVariableValueEqual } from './utils';

/**
 * Useful for rememmber variable values
 **/
export class VariableValueChangeDetector {
  private _values: Map<SceneVariable, VariableValue | undefined | null> | undefined;

  public constructor(private _sceneObject: SceneObject) {}

  public recordCurrentDependencyValues() {
    this._values = new Map();

    for (const variableName of this._sceneObject.variableDependency!.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, this._sceneObject);
      if (variable) {
        this._values.set(variable, variable.getValue());
      }
    }
  }

  public hasVariablesChangedWhileInactive(): boolean {
    if (!this._values) {
      return false;
    }

    for (const variableName of this._sceneObject.variableDependency!.getNames()) {
      const variable = sceneGraph.lookupVariable(variableName, this._sceneObject);
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
