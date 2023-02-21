import { isEqual } from 'lodash';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObject } from '../core/types';
import { SceneVariableSet } from './sets/SceneVariableSet';
import { VariableValue } from './types';

/**
 * Checks if the variable is currently loading or waiting to update
 */
export function hasVariableDependencyInLoadingState(sceneObject: SceneObject) {
  if (!sceneObject.variableDependency) {
    return false;
  }

  for (const name of sceneObject.variableDependency.getNames()) {
    const variable = sceneGraph.getVariable(name, sceneObject);
    if (!variable) {
      continue;
    }

    const set = variable.parent as SceneVariableSet;
    return set.isVariableLoadingOrWaitingToUpdate(variable);
  }

  return false;
}

export function isVariableValueEqual(a: VariableValue | null | undefined, b: VariableValue | null | undefined) {
  if (a === b) {
    return true;
  }

  return isEqual(a, b);
}
