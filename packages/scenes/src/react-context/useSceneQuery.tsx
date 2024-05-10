import { useContext, useEffect, useMemo } from 'react';
import { SceneDataProvider } from '../core/types';
import { DataQueryExtended, SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneContext } from './SceneContextProvider';

export interface UseQueryOptions {
  queries: DataQueryExtended[];
  maxDataPoints?: number;
}

/**
 * Missing a way to detect changes to queries after initial render, but should not be that hard.
 */
export function useSceneQuery(options: UseQueryOptions): SceneDataProvider {
  const { scene } = useContext(SceneContext);

  const queryRunner = useMemo(() => {
    const queryRunner = new SceneQueryRunner({
      queries: options.queries,
      maxDataPoints: options.maxDataPoints,
    });

    scene.setState({ children: [...scene.state.children, queryRunner] });

    return queryRunner;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  useEffect(() => {
    return queryRunner.activate();
  }, [queryRunner]);

  return queryRunner;
}
