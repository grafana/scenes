import { SceneContextProvider, CustomVariable } from '@grafana/scenes-react';
import { Stack, TextLink } from '@grafana/ui';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { PageWrapper } from './PageWrapper';
import { DynamicQueriesPage } from './DynamicQueriesPage';
import { RepeatByVariablePage } from './RepeatByVariablePage';
import { DynamicVisualiationPage } from './DynamicVisualizationPage';
import { DynamicVariablesPage } from './DynamicVariablesPage';
import { NestedContextsPage } from './NestedContextPage';
import { InterpolationHookPage } from './InterpolationHookPage';
import { RepeatBySeriesPage } from './RepeatBySeriesPage';
import { DemoVizLayout, urlBase } from './utils';
import { DrilldownDemoPage } from './DrilldownDemoPage';

export function ReactDemoPage() {
  return (
    <SceneContextProvider timeRange={{ from: 'now-1h', to: 'now' }} withQueryController>
      <CustomVariable name="env" query="dev, test, prod" initialValue="dev">
        <Switch>
          <Route path={`${urlBase}`} component={HomePage} exact />
          <Route path={`${urlBase}/repeat-by-variable`} component={RepeatByVariablePage} />
          <Route path={`${urlBase}/repeat-by-series`} component={RepeatBySeriesPage} />
          <Route path={`${urlBase}/dynamic-queries`} component={DynamicQueriesPage} />
          <Route path={`${urlBase}/dynamic-viz`} component={DynamicVisualiationPage} />
          <Route path={`${urlBase}/dynamic-vars`} component={DynamicVariablesPage} />
          <Route path={`${urlBase}/nested-context`} component={NestedContextsPage} />
          <Route path={`${urlBase}/interpolation-hook`} component={InterpolationHookPage} />
          <Route path={`${urlBase}/drilldown`} component={DrilldownDemoPage} />
        </Switch>
      </CustomVariable>
    </SceneContextProvider>
  );
}

function HomePage() {
  return (
    <PageWrapper title="Home" subTitle="Welcome to the React first demos">
      <Stack direction={'column'} gap={2}>
        <DemoVizLayout>
          <PlainGraphWithRandomWalk title="Welcome" maxDataPoints={50} />
        </DemoVizLayout>
        <h2>Examples</h2>
        <TextLink href={`${urlBase}/repeat-by-variable`}>Repeat by variable</TextLink>
        <TextLink href={`${urlBase}/repeat-by-series`}>Repeat by series</TextLink>
        <TextLink href={`${urlBase}/dynamic-queries`}>Dynamic queries</TextLink>
        <TextLink href={`${urlBase}/dynamic-viz`}>Dynamic visualization</TextLink>
        <TextLink href={`${urlBase}/dynamic-vars`}>Dynamic variables</TextLink>
        <TextLink href={`${urlBase}/nested-context`}>Nested contexts</TextLink>
        <TextLink href={`${urlBase}/interpolation-hook`}>Interpolation hook</TextLink>
        <TextLink href={`${urlBase}/drilldown`}>Drilldown demo</TextLink>
        <TextLink href={`${urlBase}/drilldown?from=now-5m&to=now&var-env=prod`}>
          Link with time range and variables
        </TextLink>
      </Stack>
    </PageWrapper>
  );
}
