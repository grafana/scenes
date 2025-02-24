import { CustomVariable, DataSourceVariable, QueryVariable, VariableControl } from '@grafana/scenes-react';
import { Button, Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoVizLayout } from './utils';
import { VariableHide, VariableRefresh, VariableSort } from '@grafana/schema';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function DynamicVariablesPage() {
  const [regexDsVar, setRegexDsVar] = React.useState<string | undefined>(undefined);
  const [hide, setHide] = React.useState<VariableHide>(VariableHide.dontHide);
  const [regexQueryVar, setRegexQueryVar] = React.useState<string | undefined>('/[ACDFG]/');
  const [includeAll, setIncludeAll] = React.useState<boolean>(true);
  const [sort, setSort] = React.useState<VariableSort>(VariableSort.alphabeticalAsc);

  return (
    <PageWrapper
      title="Dynamic variables"
      subTitle={
        <DemoSubTitle
          text={'Variables added via react rendering'}
          getSourceCodeModule={() => import('!!raw-loader!./DynamicVariablesPage')}
        />
      }
    >
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
      <DataSourceVariable name="dsVar" pluginId="grafana-testdata-datasource" regex={regexDsVar}>
        <Stack direction="column">
          <Stack>
            <VariableControl name="dsVar" />
            <Button variant="secondary" onClick={() => setRegexDsVar('/gdev-*/')}>
              Change regex
            </Button>
            <Button variant="secondary" onClick={() => setRegexDsVar(undefined)}>
              No regex
            </Button>
          </Stack>
          <DemoVizLayout>
            <PlainGraphWithRandomWalk title={'Testing datasource = $dsVar'} queryAlias="datasource = $dsVar" />
          </DemoVizLayout>
        </Stack>
      </DataSourceVariable>
      <QueryVariable
        name="job2"
        initialValue="A"
        query={{ query: '*', refId: 'A' }}
        datasource={{ uid: 'gdev-testdata' }}
        regex={regexQueryVar}
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
              Unhide variable
            </Button>
            <Button variant="secondary" onClick={() => setRegexQueryVar('/[BF]/')}>
              Change regex
            </Button>
            <Button variant="secondary" onClick={() => setRegexQueryVar(undefined)}>
              No regex
            </Button>
            <Button variant="secondary" onClick={() => setIncludeAll(false)}>
              Remove include all
            </Button>
            <Button variant="secondary" onClick={() => setSort(VariableSort.alphabeticalAsc)}>
              Sort asc
            </Button>
            <Button variant="secondary" onClick={() => setSort(VariableSort.alphabeticalDesc)}>
              Sort desc
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
