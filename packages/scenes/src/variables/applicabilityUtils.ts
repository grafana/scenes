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
 * Creates a matcher that pairs response entries with input filters/keys using
 * key+origin queues. For each key+origin combination, entries are dequeued in
 * order, so duplicates with the same key+origin are matched positionally within
 * their group rather than relying on global array ordering.
 */
export function buildApplicabilityMatcher(response: DrilldownsApplicability[]) {
  const queues = new Map<string, DrilldownsApplicability[]>();

  for (const entry of response) {
    const ck = compositeKey(entry.key, entry.origin);
    const queue = queues.get(ck);
    if (queue) {
      queue.push(entry);
    } else {
      queues.set(ck, [entry]);
    }
  }

  return (key: string, origin?: string): DrilldownsApplicability | undefined => {
    const queue = queues.get(compositeKey(key, origin));
    if (!queue || queue.length === 0) {
      return undefined;
    }
    return queue.shift();
  };
}

function normalizeQuery(q: SceneDataQuery): { refId: string; expr?: unknown } {
  return { refId: q.refId, expr: q.expr ?? q.expression ?? q.query };
}

export function buildApplicabilityCacheKey(parts: {
  filters?: Array<{ origin?: string; key: string; operator: string; value: string }>;
  groupByKeys?: string[];
  value?: string[];
  queries: SceneDataQuery[];
  scopes: Scope[] | undefined;
}): string {
  return JSON.stringify({
    filters: parts.filters,
    groupByKeys: parts.groupByKeys,
    value: parts.value,
    queries: parts.queries.map(normalizeQuery),
    scopes: parts.scopes?.map((s) => s.metadata.name),
  });
}
