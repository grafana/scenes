import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  Scope,
} from '@grafana/data';
import { SceneDataQuery } from '../core/types';

const COMPOSITE_KEY_SEPARATOR = '|';

function compositeKey(key: string, origin?: string): string {
  return origin ? `${key}${COMPOSITE_KEY_SEPARATOR}${origin}` : key;
}

/**
 * Builds a stateless lookup from a DS applicability response.
 * Maps each key+origin to its result. For duplicate keys the last entry wins,
 * which is the "active" one (the DS marks earlier duplicates as overridden).
 */
export function buildApplicabilityMatcher(response: DrilldownsApplicability[]) {
  const map = new Map<string, DrilldownsApplicability>();

  for (const entry of response) {
    map.set(compositeKey(entry.key, entry.origin), entry);
  }

  return (key: string, origin?: string): DrilldownsApplicability | undefined => {
    return map.get(compositeKey(key, origin));
  };
}

function normalizeQuery(q: SceneDataQuery): { refId: string; expr?: unknown } {
  return { refId: q.refId, expr: q.expr ?? q.expression ?? q.query };
}

export function buildApplicabilityCacheKey(parts: {
  filters?: Array<{ origin?: string; key: string; operator: string; value: string; values?: string[] }>;
  groupByKeys?: string[];
  value?: string[];
  queries: SceneDataQuery[];
  scopes: Scope[] | undefined;
}): string {
  return JSON.stringify({
    filters: parts.filters?.map((f) => ({
      origin: f.origin,
      key: f.key,
      operator: f.operator,
      value: f.values?.length ? f.values.join(',') : f.value,
    })),
    groupByKeys: parts.groupByKeys,
    value: parts.value,
    queries: parts.queries.map(normalizeQuery),
    scopes: parts.scopes?.map((s) => s.metadata.name),
  });
}
