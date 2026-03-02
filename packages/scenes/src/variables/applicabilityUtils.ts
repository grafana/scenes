import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
} from '@grafana/data';

function compositeKey(key: string, origin?: string): string {
  return origin ? `${key}-${origin}` : key;
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
