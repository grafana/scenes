import { CustomVariable, DataSourceVariable, VariableControl } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoVizLayout } from './utils';

export function DynamicVariablesPage() {
  return (
    <PageWrapper title="Dynamic variables" subTitle="Variables added via react rendering">
      <CustomVariable name="job" query="A, B, C" initialValue="A">
        <Stack direction="column">
          <Stack>
            <VariableControl name="job" />
          </Stack>
          <DemoVizLayout>
            <PlainGraphWithRandomWalk title={'Testing job = $job'} queryAlias="job = $job" />
          </DemoVizLayout>
        </Stack>
      </CustomVariable>
        <DataSourceVariable name="dsVar" pluginId="grafana-testdata-datasource">
          <Stack direction="column">
            <Stack>
              <VariableControl name="dsVar" />
            </Stack>
            <DemoVizLayout>
              <PlainGraphWithRandomWalk title={'Testing datasource = $dsVar'} queryAlias="datasource = $dsVar" />
            </DemoVizLayout>
          </Stack>
        </DataSourceVariable>
    </PageWrapper>
  );
}
