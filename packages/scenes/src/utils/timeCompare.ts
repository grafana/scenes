// Idempotent: compare queries may already carry the -compare suffix on their refId
// (set at request time for cache identity), so re-applying must not double-suffix.
const TIME_COMPARE_SUFFIX = '-compare';

export const getCompareSeriesRefId = (refId: string) =>
  refId.endsWith(TIME_COMPARE_SUFFIX) ? refId : `${refId}${TIME_COMPARE_SUFFIX}`;

export const getOrigSeriesRefId = (refId: string) =>
  refId.endsWith(TIME_COMPARE_SUFFIX) ? refId.slice(0, -TIME_COMPARE_SUFFIX.length) : refId;
