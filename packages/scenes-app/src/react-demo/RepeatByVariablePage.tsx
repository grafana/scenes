import { useVariableValues, CustomVariable, VariableControl } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import React from 'react';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { PageWrapper } from './PageWrapper';
import { DemoVizLayout } from './utils';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function RepeatByVariablePage() {
  return (
    <PageWrapper
      title="Repeat by variable"
      subTitle={
        <DemoSubTitle
          text={'Has a nested variable scope with a new variable which we repeat some viz panels by'}
          getSourceCodeModule={() => import('!!raw-loader!./RepeatByVariablePage')}
        />
      }
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
