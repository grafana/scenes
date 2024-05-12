import { SceneObject } from '@grafana/scenes';
import { LRUCache } from 'lru-cache';

export class SceneObjectCache {
  #cache: LRUCache<string, SceneObject>;

  public constructor() {
    this.#cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5,
    });
  }

  public add(key: string, object: SceneObject) {
    this.#cache.set(key, object);
  }

  public get<T>(key: string): T | undefined {
    return this.#cache.get(key) as T;
  }
}

export function getSceneObjectCache(): SceneObjectCache {
  if ((window as any).__sceneObjectCache) {
    return (window as any).__sceneObjectCache;
  }

  return ((window as any).__sceneObjectCache = new SceneObjectCache());
}
