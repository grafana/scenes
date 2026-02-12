import React from 'react';
import { DemoSubTitle } from '../pages/DemoSubTitle';
import { PageWrapper } from './PageWrapper';
import {
  GroupByVariable,
  GroupByVariableClass,
  VariableControl,
  useVariableInterpolator,
  useSceneContext,
  sceneGraph,
} from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import type { MetricFindValue } from '@grafana/data';

const defaultOptions: MetricFindValue[] = [
  { text: 'pod', value: 'pod' },
  { text: 'namespace', value: 'namespace' },
  { text: 'cluster', value: 'cluster' },
  { text: 'component', value: 'component' },
];

export function GroupByVariablePage() {
  return (
    <PageWrapper
      title="GroupByVariable"
      subTitle={
        <DemoSubTitle
          text={'Variables added via JSX, use VariableControl to render the UI.'}
          getSourceCodeModule={() => import('!!raw-loader!./GroupByVariablePage')}
        />
      }
    >
      <GroupByVariable
        name="groupby"
        datasource={{ uid: 'gdev-testdata', type: 'testdata' }}
        layout="horizontal"
        defaultOptions={defaultOptions}
      >
        <Stack direction="column" gap={2}>
          <GroupByVariableContent />
        </Stack>
      </GroupByVariable>
    </PageWrapper>
  );
}

function GroupByVariableContent() {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable('groupby', scene);
  const state = variable instanceof GroupByVariableClass ? variable.useState() : undefined;
  const interpolate = useVariableInterpolator({ variables: ['groupby'] });

  return (
    <>
      <div>Selected: {JSON.stringify(state?.value ?? [])}</div>
      <div>Options: {(state?.options ?? []).map((o: { label: string }) => o.label).join(', ')}</div>
      <div>Interpolated example: {interpolate('groupby=$groupby')}</div>
      <VariableControl name="groupby" />
    </>
  );
}
