import { CustomVariable, QueryVariable, SceneContextProvider, VariableControl } from '@grafana/scenes-react';
import { Button, Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoVizLayout } from './utils';
import { VariableRefresh, VariableSort } from '@grafana/schema';

export function DynamicVariablesPage() {
  const [sort, setSort] = React.useState<VariableSort>(VariableSort.alphabeticalAsc);

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
      <SceneContextProvider>
        <QueryVariable 
          name="job2" 
          initialValue="A"
          query={{ query: '*', refId: 'A' }} 
          datasource={{ uid: 'gdev-testdata' }} 
          regex='/[ACDFG]/' 
          sort={sort}
          refresh={VariableRefresh.onTimeRangeChanged}
          includeAll={true}
        >
          <Stack direction="column">
            <Stack>
              <VariableControl name="job2" />
              <Button variant="secondary" onClick={() => setSort(VariableSort.alphabeticalAsc)}>
                Sort var values ASC
              </Button>
              <Button variant="secondary" onClick={() => setSort(VariableSort.alphabeticalDesc)}>
                Sort var values DESC
              </Button>
            </Stack>
            <DemoVizLayout>
              <PlainGraphWithRandomWalk title={'Testing job2 = $job2'} queryAlias="job2 = $job2" />
            </DemoVizLayout>
          </Stack>
        </QueryVariable>
      </SceneContextProvider>
    </PageWrapper>
  );
}
