import { RCustomVariable, RVariableSelect } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoVizLayout } from './utils';

export function DynamicVariablesPage() {
  return (
    <PageWrapper title="Dynamic variables" subTitle="Variables added via react rendering">
      <RCustomVariable name="job" query="A, B, C" initialValue="A">
        <Stack direction="column">
          <Stack>
            <RVariableSelect name="job" />
          </Stack>
          <DemoVizLayout>
            <PlainGraphWithRandomWalk title={'Testing job = $job'} queryAlias="job = $job" />
          </DemoVizLayout>
        </Stack>
      </RCustomVariable>
    </PageWrapper>
  );
}
