import { useEffect } from 'react';
import { SceneQueryRunner } from '@grafana/scenes';
import { isEqual } from 'lodash';
import { useSceneObject } from './useSceneObject.js';

function useQueryRunner(options) {
  const queryRunner = useSceneObject({
    factory: (key) => new SceneQueryRunner({
      key,
      queries: options.queries,
      maxDataPoints: options.maxDataPoints,
      datasource: options.datasource,
      liveStreaming: options.liveStreaming,
      maxDataPointsFromWidth: options.maxDataPointsFromWidth
    }),
    objectConstructor: SceneQueryRunner,
    cacheKey: options.cacheKey
  });
  useEffect(() => {
    if (!isEqual(queryRunner.state.queries, options.queries)) {
      queryRunner.setState({ queries: options.queries });
      queryRunner.runQueries();
    }
  }, [queryRunner, options]);
  return queryRunner;
}

export { useQueryRunner };
//# sourceMappingURL=useQueryRunner.js.map
