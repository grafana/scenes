import React from 'react';
import { Button, Stack } from '@grafana/ui';
import { DemoSubTitle } from '../pages/DemoSubTitle';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { useLocalValueVariable, useVariableInterpolator } from '@grafana/scenes-react';

export function UseLocalValueVariableHookPage() {
  const [value, setValue] = React.useState('alpha');

  // LocalValueVariable is meant for *scoped overrides* of an existing ancestor variable.
  // First create the "global" variable, then create the local override.
  useLocalValueVariable({ name: 'local', value: 'global', text: 'global' });
  useLocalValueVariable({ name: 'local', value, text: value });

  // Avoid useVariableValue here since the variable may not exist on first render (can cause hook-order issues).
  const interpolate = useVariableInterpolator({ variables: ['local'] });
  const currentValue = interpolate('$local');

  return (
    <PageWrapper
      title="useLocalValueVariable hook"
      subTitle={
        <DemoSubTitle
          text={'Create/update a LocalValueVariable via a React hook and use it in panel aliases ($local).'}
          getSourceCodeModule={() => import('!!raw-loader!./UseLocalValueVariableHookPage')}
        />
      }
    >
      <Stack direction="column" gap={2}>
        <div>Current value: {currentValue}</div>
        <Button variant="secondary" onClick={() => setValue((v) => (v === 'alpha' ? 'beta' : 'alpha'))}>
          Toggle local value
        </Button>
        <PlainGraphWithRandomWalk title="Panel using $local" queryAlias={'local = $local'} />
      </Stack>
    </PageWrapper>
  );
}
