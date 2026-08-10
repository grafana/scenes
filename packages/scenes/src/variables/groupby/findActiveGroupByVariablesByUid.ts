import { SceneObject } from '../../core/types';
import { GroupByVariable } from './GroupByVariable';
import { appliesAutomaticallyToDatasource } from '../appliesAutomaticallyToDatasource';

export const allActiveGroupByVariables = new Set<GroupByVariable>();

/**
 * Walk up the scene graph from sceneObject to find the closest GroupByVariable
 * that applies to queries for dsUid. Use this when group-by variables can live at
 * multiple levels in the hierarchy.
 */
export function findClosestGroupByInHierarchy(
  dsUid: string | undefined,
  sceneObject: SceneObject
): GroupByVariable | undefined {
  let current: SceneObject | undefined = sceneObject;
  while (current) {
    const variables = current.state.$variables?.state.variables ?? [];
    for (const variable of variables) {
      if (variable instanceof GroupByVariable && appliesAutomaticallyToDatasource(variable, dsUid)) {
        return variable;
      }
    }
    current = current.parent;
  }

  return undefined;
}

/**
 * Search the global set of active GroupByVariables for one that applies to queries for dsUid.
 * Use this when no scene hierarchy context is available.
 */
export function findGlobalGroupByVariableByUid(dsUid: string | undefined): GroupByVariable | undefined {
  for (const groupByVariable of allActiveGroupByVariables.values()) {
    if (appliesAutomaticallyToDatasource(groupByVariable, dsUid)) {
      return groupByVariable;
    }
  }

  return undefined;
}
