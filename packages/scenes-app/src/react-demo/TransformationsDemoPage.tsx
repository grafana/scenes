import { Select, Stack } from '@grafana/ui';
import React, { useState } from 'react';
import { PageWrapper } from './PageWrapper';
import { DemoVizLayout } from './utils';
import { DataTransformerID, ReducerID } from '@grafana/data';
import { VizPanel, useDataTransformer, useQueryRunner } from '@grafana/scenes-react';
import { plainGraph } from './visualizations';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function TransformationsDemoPage() {
  const [reducer, setReducer] = useState(ReducerID.mean);

  const dataProvider = useQueryRunner({
    queries: [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: 'foo' }],
    maxDataPoints: 20,
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

  return (
    <PageWrapper
      title="Transformations"
      subTitle={
        <DemoSubTitle
          text={'Transformations demo page'}
          getSourceCodeModule={() => import('!!raw-loader!./TransformationsDemoPage')}
        />
      }
    >
      <Select
        onChange={(e) => setReducer(e.value ?? ReducerID.mean)}
        value={reducer}
        options={[
          { label: 'mean', value: ReducerID.mean },
          { label: 'variance', value: ReducerID.variance },
        ]}
      ></Select>
      <Stack direction={'column'} gap={2}>
        <DemoVizLayout>
          <VizPanel title="Viz with transformations" viz={plainGraph} dataProvider={dataTransformer} />
        </DemoVizLayout>
      </Stack>
    </PageWrapper>
  );
}
