import { GroupBySet } from './GroupBySet';

export let allActiveAggregationSets = new Set<GroupBySet>();

export function findActiveAggregationsSetByUid(dsUid: string | undefined): GroupBySet | undefined {
  for (const filter of allActiveAggregationSets.values()) {
    if (filter.state.datasource?.uid === dsUid) {
      return filter;
    }
  }

  return undefined;
}
