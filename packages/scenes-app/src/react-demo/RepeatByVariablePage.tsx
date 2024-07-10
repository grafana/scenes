import { useVariableValues, CustomVariable, VariableControl, useQueryVariable } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import React from 'react';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { PageWrapper } from './PageWrapper';
import { DemoVizLayout } from './utils';

export function RepeatByVariablePage() {
  return (
    <PageWrapper
      title="Repeat by variable"
      subTitle="Has a nested variable scope with a new variable which we repeat some viz panels by"
    >
      <CustomVariable name="panels" query="10, 20, 30, 40, 50" initialValue={['10']} isMulti>
        <Stack direction={'column'}>
          <VariableControl name="panels" />
          <RepeatPanelByVariable />
        </Stack>
      </CustomVariable>
    </PageWrapper>
  );
}
function RepeatPanelByVariable() {
  const [values, loading] = useVariableValues<string>('panels');

  //move this into a different demo
  const queryVar = useQueryVariable({ name: 'test', datasource: 'gdev-testdata', query: '*' });
  const state = queryVar?.useState();
  console.log(state?.options);

  if (loading || !values) {
    return <div>Waiting for variable</div>;
  }

  return (
    <DemoVizLayout>
      {values.map((value: string) => (
        <PlainGraphWithRandomWalk key={value} title={`${value} data points`} maxDataPoints={parseInt(value, 10)} />
      ))}
    </DemoVizLayout>
  );
}
