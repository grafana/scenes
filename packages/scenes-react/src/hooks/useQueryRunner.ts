import { useEffect } from 'react';
import { SceneDataQuery, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { isEqual } from 'lodash';
import { CacheKey } from '../caching/SceneObjectCache';
import { useSceneObject } from './useSceneObject';

export interface UseQueryOptions {
  queries: SceneDataQuery[];
  maxDataPoints?: number;
  datasource?: DataSourceRef;
  cacheKey?: CacheKey;
  liveStreaming?: boolean;
  maxDataPointsFromWidth?: boolean;
  minInterval?: string;
  /**
   * Optional prefix for the requestId. When set, request IDs will be formatted as `{requestIdPrefix}{counter}`.
   * Useful for identifying requests from specific panels or components.
   */
  requestIdPrefix?: string;
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
        liveStreaming: options.liveStreaming,
        maxDataPointsFromWidth: options.maxDataPointsFromWidth,
        minInterval: options.minInterval,
        requestIdPrefix: options.requestIdPrefix,
      }),
    objectConstructor: SceneQueryRunner,
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
