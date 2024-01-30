import { AggregationsSet } from './AggregationsSet';

export const allActiveAggregationsSets = new Set<AggregationsSet>();

export function findActiveAggregationsSetByUid(dsUid: string | undefined): AggregationsSet | undefined {
  for (const aggregationsSet of allActiveAggregationsSets.values()) {
    if (aggregationsSet.state.datasource?.uid === dsUid) {
      return aggregationsSet;
    }
  }

  return undefined;
}
