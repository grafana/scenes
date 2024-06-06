import { Select, Stack } from '@grafana/ui';
import React, { useState } from 'react';
import { PageWrapper } from './PageWrapper';
import { DemoVizLayout } from './utils';
import { GraphWithWindowTransformation } from './GraphWithTransformation';
import { ReducerID } from '@grafana/data';

export function TransformationsDemoPage() {
  const [reducer, setReducer] = useState(ReducerID.mean)
  return (
    <PageWrapper title="Transformations" subTitle="Transformations demo page">
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
          <GraphWithWindowTransformation title="Transformations" maxDataPoints={50} reducer={reducer}/>
        </DemoVizLayout>
      </Stack>
    </PageWrapper>
  );
}
