import { useEffect, useId } from 'react';
import { SceneDataQuery, SceneObject, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { isEqual } from 'lodash';
import { useSceneContext } from './hooks';
import { CacheKey, getSceneObjectCache } from '../caching/SceneObjectCache';

export interface UseQueryOptions {
  queries: SceneDataQuery[];
  maxDataPoints?: number;
  datasource?: DataSourceRef;
  cacheKey?: CacheKey<UseQueryOptions>;
}

/**
 * Maintains the state of SceneQueryRunner in the scene
 *
 * @example // To access query results do
 * const query = useQueryRunner(...);
 * const { data } = query.useState();
 */
export function useQueryRunner(options: UseQueryOptions): SceneQueryRunner {
  const queryRunner = useSceneObject({
    factory: (key) =>
      new SceneQueryRunner({
        key: key,
        queries: options.queries,
        maxDataPoints: options.maxDataPoints,
        datasource: options.datasource,
      }),
    cacheKey: options.cacheKey,
  });

  // Update queries when they change
  useEffect(() => {
    if (!isEqual(queryRunner.state.queries, options.queries)) {
      queryRunner.setState({ queries: options.queries });
      queryRunner.runQueries();
    }
  }, [queryRunner, options]);

  return queryRunner;
}

interface UseSceneObjectProps<T extends SceneObject> {
  factory: (key: string) => T;
  cacheKey?: CacheKey<any>;
}

function useSceneObject<T extends SceneObject>(options: UseSceneObjectProps<T>) {
  const scene = useSceneContext();
  const key = useId();
  const cache = getSceneObjectCache();

  let obj = scene.findByKey<T>(key);

  if (!obj && options.cacheKey) {
    obj = cache.get<T>(options.cacheKey);
    if (obj) {
      console.log('Cache hit', options.cacheKey);
    }
  }

  if (!obj) {
    obj = options.factory(key);
    if (options.cacheKey) {
      cache.add(options.cacheKey, obj);
    }
  }

  useEffect(() => scene.addToScene(obj), [obj, scene]);

  return obj;
}
