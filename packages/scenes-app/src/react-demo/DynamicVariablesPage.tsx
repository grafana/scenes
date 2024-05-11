import { RCustomVariable, RVariableSelect } from '@grafana/scenes';
import { Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';

export function DynamicVariablesPage() {
  return (
    <PageWrapper title="Dynamic variables" subTitle="Variables added via react rendering">
      <RCustomVariable name="job" query="A, B, C" initialValue="A">
        <Stack direction="column">
          <Stack>
            <RVariableSelect name="job" />
          </Stack>
          <div style={{ height: '300px', minWidth: '300px', flexGrow: 1 }}>
            <PlainGraphWithRandomWalk title={'Testing job = $job'} queryAlias="job = $job" />
          </div>
        </Stack>
      </RCustomVariable>
    </PageWrapper>
  );
}
