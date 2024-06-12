import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import React from 'react';
import { plainGraph } from './visualizations';

interface Props {
  maxDataPoints?: number;
  title: string;
  queryAlias?: string;
}

export function PlainGraphWithRandomWalk({ maxDataPoints, title, queryAlias }: Props) {
  const queries = [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: queryAlias ?? 'env = $env' }];

  const dataProvider = useQueryRunner({
    queries,
    maxDataPoints: maxDataPoints ?? 20,
    cacheKey: [queries, maxDataPoints],
  });

  return <VizPanel title={title} viz={plainGraph} dataProvider={dataProvider} />;
}
