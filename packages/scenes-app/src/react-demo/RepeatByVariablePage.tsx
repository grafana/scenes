import { useVariableValues, RVariableSelect, RCustomVariable } from '@grafana/scenes';
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
      <RCustomVariable name="panels" query="10, 20, 30, 40, 50" initialValue={['10']} isMulti>
        <Stack direction={'column'}>
          <RVariableSelect name="panels" />
          <RepeatPanelByVariable />
        </Stack>
      </RCustomVariable>
    </PageWrapper>
  );
}
function RepeatPanelByVariable() {
  const [values, loading] = useVariableValues('panels');

  if (loading || !values) {
    return <div>Waiting for variable</div>;
  }

  return (
    <DemoVizLayout>
      {(values as string[]).map((value: string) => (
        <PlainGraphWithRandomWalk key={value} title={`${value} data points`} maxDataPoints={parseInt(value, 10)} />
      ))}
    </DemoVizLayout>
  );
}
