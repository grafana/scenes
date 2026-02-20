import { useId } from 'react';
import { SceneObject, sceneGraph } from '@grafana/scenes';
import { useSceneContext } from './hooks';
import { CacheKey, SceneObjectConstructor, getSceneObjectCache } from '../caching/SceneObjectCache';
import { useAddToScene } from '../contexts/SceneContextObject';

export interface UseSceneObjectProps<T extends SceneObject> {
  factory: (key: string) => T;
  cacheKey?: CacheKey;
  objectConstructor: SceneObjectConstructor;
}

/**
 * Helper hook that handles adding and removing the scene object from the scene object graph.
 * Also handles the lookup of the object from the cache if a cache key is provided.
 */
export function useSceneObject<T extends SceneObject>(options: UseSceneObjectProps<T>) {
  const scene = useSceneContext();
  const key = useId();
  const cache = getSceneObjectCache();
  let cacheKeyHash = options.cacheKey ? cache.getHashKey(options.cacheKey, options.objectConstructor) : undefined;

  let obj = scene.findByKey<T>(key);

  if (!obj && cacheKeyHash) {
    obj = cache.get<T>(cacheKeyHash);

    if (obj && obj.parent !== scene) {
      // Before clearing parent make sure the object is not already in the scene
      if (sceneGraph.findObject(scene, (sceneObj) => sceneObj === obj)) {
        console.error('A scene object cache key matched an object that is already in the scene');
        obj = undefined;
        // Setting this to undefined so that we later do not add/overwrite the object that is already in the scene
        cacheKeyHash = undefined;
      } else {
        obj.clearParent();
      }
    }
  }

  if (!obj) {
    obj = options.factory(key);
    if (cacheKeyHash) {
      cache.add(cacheKeyHash, obj);
    }
  }

  useAddToScene(obj, scene);

  return obj;
}
