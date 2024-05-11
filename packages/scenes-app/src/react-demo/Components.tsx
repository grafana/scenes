import { useSceneQuery, RVizPanel } from '@grafana/scenes';
import { useTheme2 } from '@grafana/ui';
import React from 'react';

interface DataVizProps {
  maxDataPoints: number;
  title: string;
}

export function DataViz(props: DataVizProps) {
  const dataProvider = useSceneQuery({
    queries: [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: 'env = $env' }],
    maxDataPoints: props.maxDataPoints,
  });

  return (
    <div style={{ height: '300px', minWidth: '300px', flexGrow: 1 }}>
      <RVizPanel title={props.title} dataProvider={dataProvider} />
    </div>
  );
}

export function Line() {
  const theme = useTheme2();
  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border.weak}`,
        margin: '16px 0',
        display: 'flex',
        height: '1px',
        width: '100%',
      }}
    />
  );
}
