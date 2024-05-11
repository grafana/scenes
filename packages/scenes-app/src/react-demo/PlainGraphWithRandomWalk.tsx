import { useSceneQuery, RVizPanel } from '@grafana/scenes';
import React from 'react';
import { plainGraph } from './visualizations';

interface Props {
  maxDataPoints?: number;
  title: string;
  queryAlias?: string;
}

export function PlainGraphWithRandomWalk({ maxDataPoints, title, queryAlias }: Props) {
  const dataProvider = useSceneQuery({
    queries: [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: queryAlias ?? 'env = $env' }],
    maxDataPoints: maxDataPoints ?? 20,
  });

  return (
    <div style={{ height: '300px', minWidth: '300px', flexGrow: 1 }}>
      <RVizPanel title={title} viz={plainGraph} dataProvider={dataProvider} />
    </div>
  );
}
