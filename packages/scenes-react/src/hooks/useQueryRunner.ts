import { useEffect, useId } from 'react';
import { SceneDataLayerSet, SceneDataProvider, SceneDataQuery, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { isEqual } from 'lodash';
import { useSceneContext } from './hooks';
import { DataLayerProxyProvider } from '../DataLayerProxyProvider';

export interface UseQueryOptions {
  queries: SceneDataQuery[];
  maxDataPoints?: number;
  datasource?: DataSourceRef;
  annotations?: SceneDataProvider;
}

/**
 * Maintains the state of SceneQueryRunner in the scene
 *
 * @example // To access query results do
 * const query = useQueryRunner(...);
 * const { data } = query.useState();
 */
export function useQueryRunner(options: UseQueryOptions): SceneQueryRunner {
  const scene = useSceneContext();
  const key = useId();

  let queryRunner = scene.findByKey<SceneQueryRunner>(key);

  let data = undefined;
  if (options.annotations instanceof SceneDataLayerSet) {
      data = new DataLayerProxyProvider({ source: options.annotations.getRef() })
  }

  if (!queryRunner) {
    queryRunner = new SceneQueryRunner({
      key: key,
      queries: options.queries,
      maxDataPoints: options.maxDataPoints,
      datasource: options.datasource,
      $data: data,
    });
  }

  useEffect(() => scene.addToScene(queryRunner), [queryRunner, scene]);

  // Update queries when they change
  useEffect(() => {
    if (!isEqual(queryRunner.state.queries, options.queries)) {
      queryRunner.setState({ queries: options.queries });
      queryRunner.runQueries();
    }
  }, [queryRunner, options]);

  return queryRunner;
}
