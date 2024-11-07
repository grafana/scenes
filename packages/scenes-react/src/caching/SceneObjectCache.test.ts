import { SceneQueryRunner } from '@grafana/scenes';
import { SceneObjectCache, cacheByRef } from './SceneObjectCache';

describe('SceneObjectCache', () => {
  it('has key key adds object constructor name', () => {
    const cache = new SceneObjectCache();
    const hashKey = cache.getHashKey('key1', SceneQueryRunner);
    expect(hashKey).toBe('SceneQueryRunner-key1');
  });

  it('Supports arrays', () => {
    const cache = new SceneObjectCache();
    const hashKey = cache.getHashKey(['key1', 'key2'], SceneQueryRunner);
    expect(hashKey).toBe('SceneQueryRunner-key1,key2');
  });

  it('Can reference option values', () => {
    const cache = new SceneObjectCache();
    const queries = [{ refId: 'A' }];
    const hashKey = cache.getHashKey([queries], SceneQueryRunner);
    expect(hashKey).toBe('SceneQueryRunner-[{"refId":"A"}]');
  });

  it('Can reference option values by ref', () => {
    const cache = new SceneObjectCache();
    const queries = [{ refId: 'A' }];
    const hashKey = cache.getHashKey(cacheByRef(queries), SceneQueryRunner);
    expect(hashKey).toBe('SceneQueryRunner-0');

    // Call with same reference
    const hashKey2 = cache.getHashKey(cacheByRef(queries), SceneQueryRunner);

    // Should be same key
    expect(hashKey2).toBe('SceneQueryRunner-0');

    // Call with diff reference
    const queries2 = [...queries];
    const hashKey3 = cache.getHashKey(cacheByRef(queries2), SceneQueryRunner);

    // Should be different key
    expect(hashKey3).toBe('SceneQueryRunner-1');
  });
});
