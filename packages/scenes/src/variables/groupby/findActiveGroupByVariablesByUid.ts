import { interpolate } from '../../core/sceneGraph/sceneGraph';
import { SceneObject } from '../../core/types';
import { GroupByVariable } from './GroupByVariable';

export const allActiveGroupByVariables = new Set<GroupByVariable>();

export function findActiveGroupByVariablesByUid(
  dsUid: string | undefined,
  sceneObject?: SceneObject
): GroupByVariable | undefined {
  if (sceneObject) {
    let current: SceneObject | undefined = sceneObject;
    while (current) {
      const variables = current.state.$variables?.state.variables ?? [];
      for (const variable of variables) {
        if (variable instanceof GroupByVariable && interpolate(variable, variable.state.datasource?.uid) === dsUid) {
          return variable;
        }
      }
      current = current.parent;
    }
  }

  for (const groupByVariable of allActiveGroupByVariables.values()) {
    if (interpolate(groupByVariable, groupByVariable.state.datasource?.uid) === dsUid) {
      return groupByVariable;
    }
  }

  return undefined;
}
