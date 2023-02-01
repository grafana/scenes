import { SceneVariable } from './types';
import { SceneObject } from '../core/types';
import { SceneVariableSet } from './sets/SceneVariableSet';

export function lookupSceneVariable(name: string, sceneObject: SceneObject): SceneVariable | null | undefined {
  const variables = sceneObject.state.$variables;
  if (!variables) {
    if (sceneObject.parent) {
      return lookupSceneVariable(name, sceneObject.parent);
    } else {
      return null;
    }
  }

  const found = variables.getByName(name);
  if (found) {
    return found;
  } else if (sceneObject.parent) {
    return lookupSceneVariable(name, sceneObject.parent);
  }

  return null;
}

/**
 * Checks if the variable is currently loading or waiting to update
 */
export function hasVariableDependencyInLoadingState(sceneObject: SceneObject) {
  if (!sceneObject.variableDependency) {
    return false;
  }

  for (const name of sceneObject.variableDependency.getNames()) {
    const variable = lookupSceneVariable(name, sceneObject);
    if (!variable) {
      continue;
    }

    const set = variable.parent as SceneVariableSet;
    return set.isVariableLoadingOrWaitingToUpdate(variable);
  }

  return false;
}
