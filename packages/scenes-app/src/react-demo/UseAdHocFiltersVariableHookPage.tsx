import React from 'react';
import { DemoSubTitle } from '../pages/DemoSubTitle';
import { PageWrapper } from './PageWrapper';
import { useAdHocFiltersVariable, useVariableInterpolator } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import { DemoVizLayout } from './utils';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import type { MetricFindValue } from '@grafana/data';

export function UseAdHocFiltersVariableHookPage() {
  const interpolate = useVariableInterpolator({ variables: ['adhoc'] });

  const getTagKeysProvider = React.useCallback(async () => {
    const values: MetricFindValue[] = [
      { text: 'cluster', value: 'cluster' },
      { text: 'namespace', value: 'namespace' },
      { text: 'pod', value: 'pod' },
    ];

    return { replace: true, values };
  }, []);

  const getTagValuesProvider = React.useCallback(async (_variable: unknown, filter: { key: string }) => {
    const valuesByKey: Record<string, MetricFindValue[]> = {
      cluster: [
        { text: 'prod-eu', value: 'prod-eu' },
        { text: 'prod-us', value: 'prod-us' },
        { text: 'dev', value: 'dev' },
      ],
      namespace: [
        { text: 'grafana', value: 'grafana' },
        { text: 'kube-system', value: 'kube-system' },
        { text: 'default', value: 'default' },
      ],
      pod: [
        { text: 'api-0', value: 'api-0' },
        { text: 'api-1', value: 'api-1' },
        { text: 'frontend-0', value: 'frontend-0' },
      ],
    };

    return { replace: true, values: valuesByKey[filter.key] ?? [] };
  }, []);

  const variable = useAdHocFiltersVariable({
    name: 'adhoc',
    datasource: { uid: 'gdev-testdata', type: 'testdata' },
    layout: 'combobox',
    getTagKeysProvider,
    getTagValuesProvider,
  });

  const state = variable?.useState();

  return (
    <PageWrapper
      title="useAdHocFiltersVariable hook"
      subTitle={
        <DemoSubTitle
          text={'Create/update an AdHocFiltersVariable via a React hook, then render its UI via VariableControl.'}
          getSourceCodeModule={() => import('!!raw-loader!./UseAdHocFiltersVariableHookPage')}
        />
      }
    >
      <Stack direction="column" gap={2}>
        <Stack direction="column" gap={2}>
          <div>Filters: {JSON.stringify(state?.filters ?? [])}</div>
          <div>Interpolated example: {interpolate('filters=$adhoc')}</div>
          <div>
            {/* Render the variable UI directly (like the hook-based query variable demo renders from state) */}
            {variable ? <variable.Component model={variable} /> : <div>Variable adhoc not found</div>}
          </div>
        </Stack>

        <DemoVizLayout>
          <PlainGraphWithRandomWalk title="A Panel" queryAlias="adhoc = $adhoc" />
          <PlainGraphWithRandomWalk title="B Panel" queryAlias="adhoc = $adhoc" />
          <PlainGraphWithRandomWalk title="C Panel" queryAlias="adhoc = $adhoc" />
          <PlainGraphWithRandomWalk title="D Panel" queryAlias="adhoc = $adhoc" />
        </DemoVizLayout>
      </Stack>
    </PageWrapper>
  );
}
