import { Stack, useTheme2 } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { CustomVariable, TimeRangePicker, VariableSelect, SceneContextProvider } from '@grafana/scenes-react';
import { DemoVizLayout } from './utils';

export function NestedContextsPage() {
  return (
    <PageWrapper title="Nested context" subTitle="Nested contexts with different time ranges and variables">
      <Stack direction="column">
        <DemoVizLayout>
          <PlainGraphWithRandomWalk title="Global" />
        </DemoVizLayout>
        <Line />
        <SceneContextProvider timeRange={{ from: 'now-10m', to: 'now' }}>
          <CustomVariable name="job" query="jobA-${env}, jobB-${env}, jobC-${env}">
            <Stack direction="column">
              <Stack direction={'row'} justifyContent={'flex-end'}>
                <VariableSelect name="job" />
                <TimeRangePicker />
              </Stack>
              <DemoVizLayout>
                <PlainGraphWithRandomWalk title="Nested time range" queryAlias="job = $job" />
              </DemoVizLayout>
            </Stack>
          </CustomVariable>
        </SceneContextProvider>
      </Stack>
    </PageWrapper>
  );
}

export function Line() {
  const theme = useTheme2();

  return (
    <div
      style={{
        height: 1,
        width: '100%',
        flexGrow: 1,
        borderTop: `1px solid ${theme.colors.border.weak}`,
        margin: `8px 0`,
      }}
    />
  );
}
