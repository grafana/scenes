import React from 'react';
import { Button, Stack } from '@grafana/ui';
import { DemoSubTitle } from '../pages/DemoSubTitle';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { LocalValueVariable, useVariableInterpolator } from '@grafana/scenes-react';

export function LocalValueVariableHookPage() {
  const [value, setValue] = React.useState('alpha');

  return (
    <PageWrapper
      title="LocalValueVariable"
      subTitle={
        <DemoSubTitle
          text={'Variables added via JSX, use them in panel aliases ($local).'}
          getSourceCodeModule={() => import('!!raw-loader!./LocalValueVariableHookPage')}
        />
      }
    >
      <LocalValueVariable name="local" value={value} text={value}>
        <Stack direction="column" gap={2}>
          <LocalValueVariableContent />
          <Button variant="secondary" onClick={() => setValue((v) => (v === 'alpha' ? 'beta' : 'alpha'))}>
            Toggle local value
          </Button>
          <PlainGraphWithRandomWalk title="Panel using $local" queryAlias={'local = $local'} />
        </Stack>
      </LocalValueVariable>
    </PageWrapper>
  );
}

function LocalValueVariableContent() {
  const interpolate = useVariableInterpolator({ variables: ['local'] });
  return <div>Current value: {interpolate('$local')}</div>;
}
