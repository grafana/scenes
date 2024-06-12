import { SceneQueryRunner } from '@grafana/scenes';
import { SceneObjectCache } from './SceneObjectCache';

import { DataQueryExtended } from '@grafana/scenes/src/querying/SceneQueryRunner';

describe('SceneObjectCache', () => {
  it('has key key adds object constructor name', () => {
    const cache = new SceneObjectCache();
    const hashKey = cache.getHashKey('key1', SceneQueryRunner, {});
    expect(hashKey).toBe('SceneQueryRunner-key1');
  });

  it('Supports arrays', () => {
    const cache = new SceneObjectCache();
    const hashKey = cache.getHashKey(['key1', 'key2'], SceneQueryRunner, {});
    expect(hashKey).toBe('SceneQueryRunner-key1,key2');
  });

  it('Can reference option values', () => {
    const cache = new SceneObjectCache();
    const queries = [{ refId: 'A' }];
    const hashKey = cache.getHashKey<ComponentProps>([{ property: 'queries' }], SceneQueryRunner, { queries });
    expect(hashKey).toBe('SceneQueryRunner-[{"refId":"A"}]');
  });

  it('Can reference option values by ref', () => {
    const cache = new SceneObjectCache();
    const queries = [{ refId: 'A' }];
    const hashKey = cache.getHashKey<ComponentProps>([{ property: 'queries', byRef: true }], SceneQueryRunner, {
      queries,
    });
    expect(hashKey).toBe('SceneQueryRunner-0');

    // Call with same reference
    const hashKey2 = cache.getHashKey<ComponentProps>([{ property: 'queries', byRef: true }], SceneQueryRunner, {
      queries,
    });

    // Should be same key
    expect(hashKey2).toBe('SceneQueryRunner-0');

    // Call with diff reference
    const hashKey3 = cache.getHashKey<ComponentProps>([{ property: 'queries', byRef: true }], SceneQueryRunner, {
      queries: [...queries],
    });

    // Should be different key
    expect(hashKey3).toBe('SceneQueryRunner-1');
  });
});

interface ComponentProps {
  queries: DataQueryExtended[];
  maxDataPoints?: number;
}
