import React from 'react';
import { DemoSubTitle } from '../pages/DemoSubTitle';
import { PageWrapper } from './PageWrapper';
import {
  AdHocFiltersVariable,
  VariableControl,
  useVariableInterpolator,
  useSceneContext,
} from '@grafana/scenes-react';
import { sceneGraph } from '@grafana/scenes';
import { Stack } from '@grafana/ui';
import { DemoVizLayout } from './utils';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import type { MetricFindValue } from '@grafana/data';

const getTagKeysProvider = async () => {
  const values: MetricFindValue[] = [
    { text: 'cluster', value: 'cluster' },
    { text: 'namespace', value: 'namespace' },
    { text: 'pod', value: 'pod' },
  ];
  return { replace: true, values };
};

const getTagValuesProvider = async (_variable: unknown, filter: { key: string }) => {
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
};

export function AdHocFiltersVariableHookPage() {
  return (
    <PageWrapper
      title="AdHocFiltersVariable"
      subTitle={
        <DemoSubTitle
          text={'Variables added via JSX, use VariableControl to render the UI.'}
          getSourceCodeModule={() => import('!!raw-loader!./AdHocFiltersVariableHookPage')}
        />
      }
    >
      <AdHocFiltersVariable
        name="adhoc"
        datasource={{ uid: 'gdev-testdata', type: 'testdata' }}
        layout="combobox"
        getTagKeysProvider={getTagKeysProvider}
        getTagValuesProvider={getTagValuesProvider}
      >
        <Stack direction="column" gap={2}>
          <AdHocFiltersVariableContent />
          <DemoVizLayout>
            <PlainGraphWithRandomWalk title="A Panel" queryAlias="adhoc = $adhoc" />
            <PlainGraphWithRandomWalk title="B Panel" queryAlias="adhoc = $adhoc" />
            <PlainGraphWithRandomWalk title="C Panel" queryAlias="adhoc = $adhoc" />
            <PlainGraphWithRandomWalk title="D Panel" queryAlias="adhoc = $adhoc" />
          </DemoVizLayout>
        </Stack>
      </AdHocFiltersVariable>
    </PageWrapper>
  );
}

function AdHocFiltersVariableContent() {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable('adhoc', scene);
  const [state] = variable?.useState?.() ?? [];
  const interpolate = useVariableInterpolator({ variables: ['adhoc'] });

  return (
    <Stack direction="column" gap={2}>
      <div>Filters: {JSON.stringify(state?.filters ?? [])}</div>
      <div>Interpolated example: {interpolate('filters=$adhoc')}</div>
      <VariableControl name="adhoc" />
    </Stack>
  );
}
