// Idempotent: compare queries may already carry the -compare suffix on their refId
// (set at request time for cache identity), so re-applying must not double-suffix.
export const getCompareSeriesRefId = (refId: string) => (refId.endsWith('-compare') ? refId : `${refId}-compare`);
