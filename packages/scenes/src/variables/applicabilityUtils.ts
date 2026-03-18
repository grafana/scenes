import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
} from '@grafana/data';

const COMPOSITE_KEY_SEPARATOR = '|';

function compositeKey(key: string, origin?: string, index?: number): string {
  let result = origin ? `${key}${COMPOSITE_KEY_SEPARATOR}${origin}` : key;
  if (index !== undefined) {
    result += `${COMPOSITE_KEY_SEPARATOR}${index}`;
  }
  return result;
}

/**
 * Builds a lookup from a DS applicability response.
 *
 * Each entry is stored under both an index-aware key (`key|origin|index`)
 * and a plain key (`key|origin`). Pass `index` when the response can
 * contain duplicate keys (e.g. two user filters with the same label) to
 * get precise positional matching. Without `index`, duplicate keys
 * collapse to last-wins which is safe for inherently-unique sets like
 * groupBy keys.
 */
export function buildApplicabilityMatcher(response: DrilldownsApplicability[]) {
  const map = new Map<string, DrilldownsApplicability>();

  for (let i = 0; i < response.length; i++) {
    const entry = response[i];
    map.set(compositeKey(entry.key, entry.origin, i), entry);
    map.set(compositeKey(entry.key, entry.origin), entry);
  }

  return (key: string, origin?: string, index?: number): DrilldownsApplicability | undefined => {
    return map.get(compositeKey(key, origin, index));
  };
}
