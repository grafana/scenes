import { useVariableInterpolator } from '@grafana/scenes-react';
import { Button, Stack } from '@grafana/ui';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { locationService } from '@grafana/runtime';
import { RenderCounter } from './utils';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function InterpolationHookPage() {
  return (
    <PageWrapper
      title="Interpolation hook"
      subTitle={
        <DemoSubTitle
          text={'Testing a hook that makes any component re-render when variable or time range change'}
          getSourceCodeModule={() => import('!!raw-loader!./InterpolationHookPage')}
        />
      }
    >
      <Stack direction="column">
        <RenderCounter name="Page" />
        <PageBody />
      </Stack>
    </PageWrapper>
  );
}

/**
 * Memoized to make sure re-render due to location change is not re-rendering this
 */
const PageBody = React.memo(() => {
  const interpolator = useVariableInterpolator({ variables: ['env'], timeRange: true });

  const onUpdateQueryParam = () => {
    locationService.partial({ someParam: '1' });
  };

  const onSetEnvVariable = () => {
    locationService.partial({ 'var-env': 'prod' });
  };

  return (
    <Stack direction="column" gap={2}>
      <RenderCounter name="Memozied component" />
      <div>$env: {interpolator('$env')}</div>
      <div>__url_time_range: {interpolator('$__url_time_range')}</div>
      <Stack>
        <Button variant="secondary" onClick={onUpdateQueryParam}>
          Update query param
        </Button>
        <Button variant="secondary" onClick={onSetEnvVariable}>
          Set env var to prod via url
        </Button>
      </Stack>
    </Stack>
  );
});

PageBody.displayName = 'PageBody';
