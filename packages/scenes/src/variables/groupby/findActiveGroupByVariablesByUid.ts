import { AggregationsSet } from './AggregationsSet';
import { GroupByVariable } from './GroupByVariable';

export const allActiveAggregationsSets = new Set<AggregationsSet>();

export function findActiveAggregationsSetByUid(dsUid: string | undefined): AggregationsSet | undefined {
  for (const aggregationsSet of allActiveAggregationsSets.values()) {
    if (aggregationsSet.state.datasource?.uid === dsUid) {
      return aggregationsSet;
    }
  }

  return undefined;
}

export const allActiveGroupByVariables = new Set<GroupByVariable>();

export function findActiveGroupByVariablesByUid(dsUid: string | undefined): GroupByVariable | undefined {
  for (const groupByVariable of allActiveGroupByVariables.values()) {
    if (groupByVariable.state.datasource?.uid === dsUid) {
      return groupByVariable;
    }
  }

  return undefined;
}
