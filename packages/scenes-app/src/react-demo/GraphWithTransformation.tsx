import { useQueryRunner, useDataTransformer, VizPanel } from '@grafana/scenes-react';
import React from 'react';
import { plainGraph } from './visualizations';
import { DataTransformerID, ReducerID } from '@grafana/data';

interface Props {
  maxDataPoints?: number;
  title: string;
  reducer: ReducerID;
}

export function GraphWithWindowTransformation({ maxDataPoints, title, reducer}: Props) {
  const dataProvider = useQueryRunner({
    queries: [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: 'foo'}],
    maxDataPoints: maxDataPoints ?? 20,
  });

  // Unfortunately the option definitions are currently not exported from grafana data.
  const transformerOptions = {
    mode: 'windowFunctions',
    window: {
      windowSize: 10,
      windowSizeMode: 'percentage',
      windowAlignment: 'center',
      field: 'foo',
      reducer: reducer,
    },
  };

  const dataTransformer = useDataTransformer({
    transformations: [{ id: DataTransformerID.calculateField, options: transformerOptions }],
    data: dataProvider,
  });

  return <VizPanel title={title} viz={plainGraph} dataProvider={dataTransformer} />;
}
