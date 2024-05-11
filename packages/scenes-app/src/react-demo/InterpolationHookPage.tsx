import { useVariableInterpolator } from '@grafana/scenes';
import { Button, Stack } from '@grafana/ui';
import React, { useEffect, useRef } from 'react';
import { PageWrapper } from './PageWrapper';
import { locationService } from '@grafana/runtime';

export function InterpolationHookPage() {
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
  });

  return (
    <PageWrapper
      title="Interpolation hook"
      subTitle="Testing a hook that makes any component re-render when variable or time range change"
    >
      <Stack direction="column">
        <div>PageRender: {renderCount.current}</div>
        <PageBody />
      </Stack>
    </PageWrapper>
  );
}

/**
 * Memoized to make sure re-render due to location change is not re-rendering this
 */
const PageBody = React.memo(() => {
  const renderCount = useRef<number>(0);
  const interpolator = useVariableInterpolator({ variables: ['env'], timeRange: true });

  useEffect(() => {
    renderCount.current += 1;
  });

  const onUpdateQueryParam = () => {
    locationService.partial({ someParam: '1' });
  };

  const onSetEnvVariable = () => {
    locationService.partial({ 'var-env': 'prod' });
  };

  return (
    <Stack direction="column">
      <div>InnerRender: {renderCount.current}</div>
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
