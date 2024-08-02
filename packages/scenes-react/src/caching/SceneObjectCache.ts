import { SceneObject } from '@grafana/scenes';
import { isPlainObject } from 'lodash';
import { LRUCache } from 'lru-cache';

export type CacheKey = CacheKeyPart | CacheKeyPart[];

export type CacheKeyPart = string | number | object | boolean;

export type SceneObjectConstructor = { new (...args: never[]): SceneObject };

export class SceneObjectCache {
  #cache: LRUCache<string, SceneObject>;
  #objectRefIds = new WeakMap<any, number>();
  #objectRefIdCounter = 0;

  public constructor() {
    this.#cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5,
    });
  }

  public add(keyHash: string, object: SceneObject) {
    this.#cache.set(keyHash, object);
  }

  public get<T>(keyHash: string): T | undefined {
    return this.#cache.get(keyHash) as T;
  }

  public getHashKey(key: CacheKey, type: SceneObjectConstructor): string {
    if (Array.isArray(key)) {
      return `${type.name}-${key.map((k) => this.getHashKeyElement(k)).join()}`;
    }

    return `${type.name}-${this.getHashKeyElement(key)}`;
  }

  public getByRefHashKey(obj: unknown) {
    let objectRefId = this.#objectRefIds.get(obj);
    if (objectRefId == null) {
      objectRefId = this.#objectRefIdCounter++;
      this.#objectRefIds.set(obj, objectRefId);
    }

    return objectRefId;
  }

  private getHashKeyElement<T>(key: CacheKey) {
    if (typeof key === 'string' || typeof key === 'boolean' || typeof key === 'number') {
      return key;
    }

    return getObjectHash(key);
  }
}

let cache: SceneObjectCache | undefined;

export function getSceneObjectCache(): SceneObjectCache {
  if (cache) {
    return cache;
  }

  return (cache = new SceneObjectCache());
}

/**
 * Returns a unique hash key string for the given object reference.
 */
export function cacheByRef(value: unknown) {
  const cache = getSceneObjectCache();
  return cache.getByRefHashKey(value);
}

export function getObjectHash(obj: unknown): string {
  return JSON.stringify(obj, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val)
          .sort()
          .reduce((result, key) => {
            result[key] = val[key];
            return result;
          }, {} as any)
      : val
  );
}
