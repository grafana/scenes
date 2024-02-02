import { GroupByVariable } from './GroupByVariable';

export const allActiveGroupByVariables = new Set<GroupByVariable>();

export function findActiveGroupByVariablesByUid(dsUid: string | undefined): GroupByVariable | undefined {
  for (const groupByVariable of allActiveGroupByVariables.values()) {
    if (groupByVariable.state.datasource?.uid === dsUid) {
      return groupByVariable;
    }
  }

  return undefined;
}
