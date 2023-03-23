import { SceneObject } from '../core/types';
import { SceneVariable } from './types';

/**
 * Will walk the scene object graph up to the root looking for the first variable with the specified name
 */
export function lookupVariable(name: string, sceneObject: SceneObject): SceneVariable | null {
  const variables = sceneObject.state.$variables;
  if (!variables) {
    if (sceneObject.parent) {
      return lookupVariable(name, sceneObject.parent);
    } else {
      return null;
    }
  }

  const found = variables.getByName(name);
  if (found) {
    return found;
  } else if (sceneObject.parent) {
    return lookupVariable(name, sceneObject.parent);
  }

  return null;
}
