import React from 'react';
import { DemoSubTitle } from '../pages/DemoSubTitle';
import { PageWrapper } from './PageWrapper';
import { useGroupByVariable, useVariableInterpolator } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import type { MetricFindValue } from '@grafana/data';

export function UseGroupByVariableHookPage() {
  const interpolate = useVariableInterpolator({ variables: ['groupby'] });

  const defaultOptions: MetricFindValue[] = React.useMemo(
    () => [
      { text: 'pod', value: 'pod' },
      { text: 'namespace', value: 'namespace' },
      { text: 'cluster', value: 'cluster' },
      { text: 'component', value: 'component' },
    ],
    []
  );

  const variable = useGroupByVariable({
    name: 'groupby',
    datasource: { uid: 'gdev-testdata', type: 'testdata' },
    layout: 'horizontal',
    defaultOptions,
  });

  const state = variable?.useState();

  return (
    <PageWrapper
      title="useGroupByVariable hook"
      subTitle={
        <DemoSubTitle
          text={'Create/update a GroupByVariable via a React hook, then render its UI via VariableControl.'}
          getSourceCodeModule={() => import('!!raw-loader!./UseGroupByVariableHookPage')}
        />
      }
    >
      <Stack direction="column" gap={2}>
        <div>Selected: {JSON.stringify(state?.value ?? [])}</div>
        <div>Options: {(state?.options ?? []).map((o) => o.label).join(', ')}</div>
        <div>Interpolated example: {interpolate('groupby=$groupby')}</div>
        <div>{variable ? <variable.Component model={variable} /> : <div>Variable groupby not found</div>}</div>
      </Stack>
    </PageWrapper>
  );
}
