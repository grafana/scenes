import { SceneObject } from '@grafana/scenes';
import { isPlainObject } from 'lodash';
import { LRUCache } from 'lru-cache';

export type CacheKey<T = {}> = string | CacheKeyPartOptionsProperty<T> | Array<string | CacheKeyPartOptionsProperty<T>>;

export type CacheKeyPartOptionsProperty<T = {}> = { property: keyof T; byRef?: boolean };
//export type CacheKeyPartObjectValue = { value: any, byRef?: boolean };

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

  public add(key: CacheKey, object: SceneObject) {
    this.#cache.set(getHashKey(key), object);
  }

  public get<T>(key: CacheKey): T | undefined {
    return this.#cache.get(getHashKey(key)) as T;
  }

  public getHashKey<T = {}>(key: CacheKey<T>, type: SceneObjectConstructor, values?: T): string {
    if (Array.isArray(key)) {
      return `${type.name}-${key.map((k) => this.getHashKeyElement(k, values)).join()}`;
    }

    return `${type.name}-${this.getHashKeyElement(key, values)}`;
  }

  private getObjectRefId(obj: unknown) {
    let objectRefId = this.#objectRefIds.get(obj);
    if (objectRefId == null) {
      objectRefId = this.#objectRefIdCounter++;
      this.#objectRefIds.set(obj, objectRefId);
    }

    return objectRefId;
  }

  private getHashKeyElement<T>(key: CacheKey<T>, values?: T) {
    if (typeof key === 'string') {
      return key;
    }

    if ('property' in key) {
      const value = values && values[key.property];
      if (value == null) {
        return '';
      }

      if (key.byRef) {
        return this.getObjectRefId(value);
      }

      return JSON.stringify(value);
    }
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
