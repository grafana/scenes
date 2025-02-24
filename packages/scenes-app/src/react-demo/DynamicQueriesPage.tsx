import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { Field, Select, Stack } from '@grafana/ui';
import React, { useMemo, useState } from 'react';
import { DATASOURCE_REF } from '../constants';
import { PageWrapper } from './PageWrapper';
import { toOption } from '@grafana/data';
import { SceneDataQuery } from '@grafana/scenes';
import { plainGraph } from './visualizations';
import { DemoVizLayout } from './utils';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function DynamicQueriesPage() {
  const scenarios = ['Slow query', 'Random walk'].map(toOption);
  const [scenario, setScenario] = useState<string>('Random walk');
  const queries = useMemo(() => buildQueriesForScenario(scenario), [scenario]);

  const dataProvider = useQueryRunner({ queries: queries, maxDataPoints: 100, datasource: DATASOURCE_REF });

  return (
    <PageWrapper
      title="Dynamic queriues"
      subTitle={
        <DemoSubTitle
          text={'Rebuild queries based on some user input / state'}
          getSourceCodeModule={() => import('!!raw-loader!./RepeatBySeriesPage')}
        />
      }
    >
      <Stack direction="column">
        <Stack>
          <Field label="Query scenario">
            <Select value={scenario} options={scenarios} onChange={(x) => setScenario(x.value!)} />
          </Field>
        </Stack>
        <DemoVizLayout>
          <VizPanel title={scenario} dataProvider={dataProvider} viz={plainGraph} />
        </DemoVizLayout>
      </Stack>
    </PageWrapper>
  );
}

function buildQueriesForScenario(scenario: string): SceneDataQuery[] {
  switch (scenario) {
    case 'Random walk':
      return [
        {
          refId: 'A',
          scenarioId: 'random_walk',
          alias: 'random walk',
        },
      ];
    case 'Slow query':
    default:
      return [
        {
          refId: 'A',
          scenarioId: 'slow_query',
          alias: 'Slow query',
          stringInput: '2s',
        },
      ];
  }
}
