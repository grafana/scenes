import {
  SceneContextProvider,
  useVariableValues,
  RVariableSelect,
  CustomVariable,
  SceneVariableSet,
} from '@grafana/scenes';
import { Stack } from '@grafana/ui';
import React from 'react';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { PageWrapper } from './PageWrapper';

export function RepeatByVariablePage() {
  return (
    <PageWrapper
      title="Repeat by variable"
      subTitle="Has a nested variable scope with a new variable which we repeat some viz panels by"
    >
      <SceneContextProvider initialState={{ $variables: getRepeatVariable() }}>
        <Stack direction={'column'}>
          <RVariableSelect name="panels" />
          <RepeatPanelByVariable />
        </Stack>
      </SceneContextProvider>
    </PageWrapper>
  );
}
function RepeatPanelByVariable() {
  const [values, loading] = useVariableValues('panels');

  if (loading || !values) {
    return <div>Waiting for variable</div>;
  }

  return (
    <Stack direction="row" wrap={'wrap'} gap={2}>
      {(values as string[]).map((value: string) => (
        <PlainGraphWithRandomWalk key={value} title={`${value} data points`} maxDataPoints={parseInt(value, 10)} />
      ))}
    </Stack>
  );
}

export function getRepeatVariable() {
  return new SceneVariableSet({
    variables: [new CustomVariable({ name: 'panels', query: '10, 20, 30, 40, 50', value: ['10'], isMulti: true })],
  });
}
