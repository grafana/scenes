import { useSceneQuery, RVizPanel } from '@grafana/scenes';
import React from 'react';
import { plainGraph } from './visualizations';

interface Props {
  maxDataPoints: number;
  title: string;
}

export function PlainGraphWithRandomWalk(props: Props) {
  const dataProvider = useSceneQuery({
    queries: [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: 'env = $env' }],
    maxDataPoints: props.maxDataPoints,
  });

  return (
    <div style={{ height: '300px', minWidth: '300px', flexGrow: 1 }}>
      <RVizPanel title={props.title} viz={plainGraph} dataProvider={dataProvider} />
    </div>
  );
}
