import { useQueryVariable } from '@grafana/scenes-react';
import { Button, Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { DemoVizLayout } from './utils';
import { VariableValueOption } from '@grafana/scenes';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function UseQueryVariableHookPage() {
  const [regex, setRegex] = React.useState<string | undefined>(undefined);
  const queryVar = useQueryVariable({ name: 'test', datasource: 'gdev-testdata', query: '*', regex });
  const options = queryVar?.useState()?.options;

  if (!options) {
    return <div>No variable options found</div>;
  }

  const onUpdateQueryVarRegex = () => {
    setRegex('/[ABC]/');
  };

  return (
    <PageWrapper
      title="useQueryVariable hook"
      subTitle={
        <DemoSubTitle
          text={'Testing a hook that provides an alternative way of creating a query variable'}
          getSourceCodeModule={() => import('!!raw-loader!./UseQueryVariableHookPage')}
        />
      }
    >
      <Stack direction="column">
        <Stack direction="column" gap={2}>
          <div>Variable label: {options.map((val) => val.label).join(',')}</div>
          <div>Variable value: {options.map((val) => val.value).join(',')}</div>
          <Button variant="secondary" onClick={onUpdateQueryVarRegex}>
            Update query variable regex
          </Button>
        </Stack>
      </Stack>
      <DemoVizLayout>
        {options.map((option: VariableValueOption) => (
          <PlainGraphWithRandomWalk key={option.label} title={`${option.value} Panel`} />
        ))}
      </DemoVizLayout>
    </PageWrapper>
  );
}
