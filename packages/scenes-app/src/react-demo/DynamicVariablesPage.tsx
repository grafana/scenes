import { CustomVariable, QueryVariable, VariableControl, } from '@grafana/scenes-react';
import { Button, Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoVizLayout } from './utils';
import { VariableHide, VariableRefresh, VariableSort } from '@grafana/schema';

export function DynamicVariablesPage() {
  const [hide, setHide] = React.useState<VariableHide>(VariableHide.dontHide);
  const [regex, setRegex] = React.useState<string | undefined>('/[ACDFG]/');
  const [includeAll, setIncludeAll] = React.useState<boolean>(true);
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
      <QueryVariable 
        name="job2" 
        initialValue="A"
        query={{ query: '*', refId: 'A' }} 
        datasource={{ uid: 'gdev-testdata' }} 
        regex={regex} 
        hide={hide}
        refresh={VariableRefresh.onTimeRangeChanged}
        includeAll={includeAll}
        sort={sort}
      >
        <Stack direction="column">
          <Stack>
            <VariableControl name="job2" />
            <Button variant="secondary" onClick={() => setHide(VariableHide.hideLabel)}>
              Hide label
            </Button>
            <Button variant="secondary" onClick={() => setHide(VariableHide.hideVariable)}>
              Hide variable
            </Button>
            <Button variant="secondary" onClick={() => setHide(VariableHide.dontHide)}>
              dont hide variable
            </Button>
            <Button variant="secondary" onClick={() => setRegex('/[BF]/')}>
              change regex
            </Button>
            <Button variant="secondary" onClick={() => setRegex(undefined)}>
              no regex
            </Button>
            <Button variant="secondary" onClick={() => setIncludeAll(false)}>
              remove include all
            </Button>
            <Button variant="secondary" onClick={() => setSort(VariableSort.alphabeticalAsc)}>
              sort asc
            </Button>
            <Button variant="secondary" onClick={() => setSort(VariableSort.alphabeticalDesc)}>
              sort desc
            </Button>
          </Stack>
          <DemoVizLayout>
            <PlainGraphWithRandomWalk title={'Testing job2 = $job2'} queryAlias="job2 = $job2" />
          </DemoVizLayout>
        </Stack>
      </QueryVariable>
    </PageWrapper>
  );
}
