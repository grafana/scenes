import { useSceneQuery, RVizPanel } from '@grafana/scenes';
import { Field, Select, Stack } from '@grafana/ui';
import React, { useMemo, useState } from 'react';
import { DATASOURCE_REF } from '../constants';
import { PageWrapper } from './PageWrapper';
import { toOption } from '@grafana/data';
import { DataQueryExtended } from '@grafana/scenes/src/querying/SceneQueryRunner';
import { plainGraph } from './visualizations';

export function DynamicQueriesPage() {
  const scenarios = ['Slow query', 'Random walk'].map(toOption);
  const [scenario, setScenario] = useState<string>('Random walk');
  const queries = useMemo(() => buildQueriesForScenario(scenario), [scenario]);

  const dataProvider = useSceneQuery({ queries: queries, maxDataPoints: 100, datasource: DATASOURCE_REF });

  return (
    <PageWrapper title="Dynamic queriues" subTitle="Rebuild queries based on some user input / state">
      <Stack direction="column">
        <Stack>
          <Field label="Query scenario">
            <Select value={scenario} options={scenarios} onChange={(x) => setScenario(x.value!)} />
          </Field>
        </Stack>
        <div style={{ height: '300px', minWidth: '300px', flexGrow: 1 }}>
          <RVizPanel title={scenario} dataProvider={dataProvider} viz={plainGraph} />
        </div>
      </Stack>
    </PageWrapper>
  );
}

function buildQueriesForScenario(scenario: string): DataQueryExtended[] {
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
