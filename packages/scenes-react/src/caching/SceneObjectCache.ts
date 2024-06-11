import { SceneObject } from '@grafana/scenes';
import { LRUCache } from 'lru-cache';

export type CacheKey = string | string[];

export class SceneObjectCache {
  #cache: LRUCache<string, SceneObject>;

  public constructor() {
    this.#cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5,
    });
  }

  public add(key: CacheKey, object: SceneObject) {
    this.#cache.set(getHashKey(key), object);
  }

  public get<T>(key: CacheKey): T | undefined {
    return this.#cache.get(getHashKey(key)) as T;
  }
}

export function getSceneObjectCache(): SceneObjectCache {
  if ((window as any).__sceneObjectCache) {
    return (window as any).__sceneObjectCache;
  }

  return ((window as any).__sceneObjectCache = new SceneObjectCache());
}

function getHashKey(key: CacheKey): string {
  return JSON.stringify(key);
}

// export function hashQueryKeyByOptions<TQueryKey extends QueryKey = QueryKey>(
//     queryKey: TQueryKey,

//   ): string {
//     const hashFn = options?.queryKeyHashFn || hashKey
//     return hashFn(queryKey)
//   }

//   export function hashKey(queryKey: QueryKey | MutationKey): string {
//     return JSON.stringify(queryKey, (_, val) =>
//       isPlainObject(val)
//         ? Object.keys(val)
//             .sort()
//             .reduce((result, key) => {
//               result[key] = val[key]
//               return result
//             }, {} as any)
//         : val,
//     )
//   }
