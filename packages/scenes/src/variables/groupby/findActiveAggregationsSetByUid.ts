import { AggregationsSet } from './GroupBySet';

export let allActiveAggregationSets = new Set<AggregationsSet>();

export function findActiveAggregationsSetByUid(dsUid: string | undefined): AggregationsSet | undefined {
  for (const filter of allActiveAggregationSets.values()) {
    if (filter.state.datasource?.uid === dsUid) {
      return filter;
    }
  }

  return undefined;
}
