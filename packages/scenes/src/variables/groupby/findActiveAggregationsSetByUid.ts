import { AggregationsSet } from './AggregationsSet';
import { AggregationsSetVariable } from './AggregationsSetVariable';

export const allActiveAggregationsSets = new Set<AggregationsSet>();

export function findActiveAggregationsSetByUid(dsUid: string | undefined): AggregationsSet | undefined {
  for (const aggregationsSet of allActiveAggregationsSets.values()) {
    if (aggregationsSet.state.datasource?.uid === dsUid) {
      return aggregationsSet;
    }
  }

  return undefined;
}
export const allActiveAggregationsSetVariables = new Set<AggregationsSetVariable>();

export function findActiveAggregationsSetVariablesByUid(
  dsUid: string | undefined
): AggregationsSetVariable | undefined {
  for (const aggregationsSet of allActiveAggregationsSetVariables.values()) {
    if (aggregationsSet.state.datasource?.uid === dsUid) {
      return aggregationsSet;
    }
  }

  return undefined;
}
