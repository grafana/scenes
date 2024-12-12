import { useId, useEffect } from 'react';
import { SceneQueryRunner } from '@grafana/scenes';
import { isEqual } from 'lodash';
import { useSceneContext } from './hooks.js';

function useQueryRunner(options) {
  const scene = useSceneContext();
  const key = useId();
  let queryRunner = scene.findByKey(key);
  if (!queryRunner) {
    queryRunner = new SceneQueryRunner({
      key,
      queries: options.queries,
      maxDataPoints: options.maxDataPoints,
      datasource: options.datasource,
      liveStreaming: options.liveStreaming,
      maxDataPointsFromWidth: options.maxDataPointsFromWidth
    });
  }
  useEffect(() => scene.addToScene(queryRunner), [queryRunner, scene]);
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
