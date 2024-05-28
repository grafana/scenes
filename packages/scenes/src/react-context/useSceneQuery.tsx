import { useEffect, useId } from 'react';
import { SceneDataProvider } from '../core/types';
import { DataQueryExtended, SceneQueryRunner } from '../querying/SceneQueryRunner';
import { DataSourceRef } from '@grafana/schema';
import { isEqual } from 'lodash';
import { useSceneContext } from './hooks';

export interface UseQueryOptions {
  queries: DataQueryExtended[];
  maxDataPoints?: number;
  datasource?: DataSourceRef;
}

/**
 * Maintains the state of SceneQueryRunner in the scene
 *
 * @example // To access query results do
 * const query = useSceneQuery(...);
 * const { data } = query.useState();
 */
export function useSceneQuery(options: UseQueryOptions): SceneDataProvider {
  const scene = useSceneContext();
  const key = useId();

  let queryRunner = scene.findByKey<SceneQueryRunner>(key);

  if (!queryRunner) {
    queryRunner = new SceneQueryRunner({
      key: key,
      queries: options.queries,
      maxDataPoints: options.maxDataPoints,
      datasource: options.datasource,
    });
  }

  useEffect(() => {
    scene.addToScene(queryRunner);
    const deactivate = queryRunner.activate();

    return () => {
      scene.removeFromScene(queryRunner);
      return deactivate();
    };
  }, [queryRunner, scene]);

  // Update queries when they change
  useEffect(() => {
    if (!isEqual(queryRunner.state.queries, options.queries)) {
      queryRunner.setState({ queries: options.queries });
      queryRunner.runQueries();
    }
  }, [queryRunner, options]);

  return queryRunner;
}
