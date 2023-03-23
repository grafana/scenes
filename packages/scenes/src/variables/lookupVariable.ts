import { DataLinkBuiltInVars } from '@grafana/data';
import { SceneObject } from '../core/types';
import { SceneVariable } from './types';

/**
 * Will walk the scene object graph up to the root looking for the first variable with the specified name
 */
export function lookupVariable(name: string, sceneObject: SceneObject): SceneVariable | null | undefined {
  if (name === DataLinkBuiltInVars.includeVars) {
    return null;
  }

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

export function lookupAllVariables(sceneObject: SceneObject): Record<string, SceneVariable> {
  const result: Record<string, SceneVariable> = Object.fromEntries(
    sceneObject.state.$variables?.state.variables.map((v) => [v.state.name, v]) ?? []
  )

  if (sceneObject.parent) {
    return {
      ...lookupAllVariables(sceneObject.parent),
      ...result,
    }
  }
  return result;
}
