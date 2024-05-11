import { SceneContextProvider, RCustomVariable } from '@grafana/scenes';
import { Stack, TextLink } from '@grafana/ui';
import React from 'react';
import { prefixRoute } from '../utils/utils.routing';
import { ROUTES } from '../constants';
import { Route, Switch } from 'react-router-dom';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { PageWrapper } from './PageWrapper';
import { DynamicQueriesPage } from './DynamicQueriesPage';
import { RepeatByVariablePage } from './RepeatByVariablePage';
import { DynamicVisualiationPage } from './DynamicVisualizationPage';
import { DynamicVariablesPage } from './DynamicVariablesPage';
import { NestedContextsPage } from './NestedContextPage';

export function ReactDemoPage() {
  return (
    <SceneContextProvider timeRange={{ from: 'now-1h', to: 'now' }}>
      <RCustomVariable name="env" query="dev, test, prod" initialValue="dev">
        <Switch>
          <Route path={prefixRoute(`${ROUTES.ReactDemo}`)} component={HomePage} exact />
          <Route path={prefixRoute(`${ROUTES.ReactDemo}/repeat-by-variable`)} component={RepeatByVariablePage} />
          <Route path={prefixRoute(`${ROUTES.ReactDemo}/dynamic-queries`)} component={DynamicQueriesPage} />
          <Route path={prefixRoute(`${ROUTES.ReactDemo}/dynamic-viz`)} component={DynamicVisualiationPage} />
          <Route path={prefixRoute(`${ROUTES.ReactDemo}/dynamic-vars`)} component={DynamicVariablesPage} />
          <Route path={prefixRoute(`${ROUTES.ReactDemo}/nested-context`)} component={NestedContextsPage} />
        </Switch>
      </RCustomVariable>
    </SceneContextProvider>
  );
}

function HomePage() {
  return (
    <PageWrapper title="Home" subTitle="Welcome to the React first demos">
      <Stack direction={'column'} gap={2}>
        <PlainGraphWithRandomWalk title="Welcome" maxDataPoints={50} />
        <h2>Examples</h2>
        <TextLink href={prefixRoute(`${ROUTES.ReactDemo}/repeat-by-variable`)}>Repeat by variable</TextLink>
        <TextLink href={prefixRoute(`${ROUTES.ReactDemo}/dynamic-queries`)}>Dynamic queries</TextLink>
        <TextLink href={prefixRoute(`${ROUTES.ReactDemo}/dynamic-viz`)}>Dynamic visualization</TextLink>
        <TextLink href={prefixRoute(`${ROUTES.ReactDemo}/dynamic-vars`)}>Dynamic variables</TextLink>
        <TextLink href={prefixRoute(`${ROUTES.ReactDemo}/nested-context`)}>Nested contexts</TextLink>
      </Stack>
    </PageWrapper>
  );
}
