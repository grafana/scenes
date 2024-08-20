import { CustomVariable, DataSourceVariable, VariableControl } from '@grafana/scenes-react';
import { Button, Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoVizLayout } from './utils';

export function DynamicVariablesPage() {
  const [regex, setRegex] = React.useState<string | undefined>(undefined);

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
        <DataSourceVariable name="dsVar" pluginId="grafana-testdata-datasource" regex={regex}>
          <Stack direction="column">
            <Stack>
              <VariableControl name="dsVar" />
              <Button variant="secondary" onClick={() => setRegex('/gdev-*/')}>
                change regex
              </Button>
              <Button variant="secondary" onClick={() => setRegex(undefined)}>
                no regex
              </Button>
            </Stack>
            <DemoVizLayout>
              <PlainGraphWithRandomWalk title={'Testing datasource = $dsVar'} queryAlias="datasource = $dsVar" />
            </DemoVizLayout>
          </Stack>
        </DataSourceVariable>
    </PageWrapper>
  );
}
