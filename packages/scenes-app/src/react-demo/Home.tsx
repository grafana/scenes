import { SceneContextProvider, CustomVariable } from '@grafana/scenes-react';
import { Stack, TextLink } from '@grafana/ui';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
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
import { AnnotationDemoPage } from './AnnotationsDemoPage';
import { TransformationsDemoPage } from './TransformationsDemoPage';
import { UseQueryVariableHookPage } from './UseQueryVariableHookPage';

export function ReactDemoPage() {
  return (
    <SceneContextProvider timeRange={{ from: 'now-1h', to: 'now' }} withQueryController>
      <CustomVariable name="env" query="dev, test, prod" initialValue="dev">
        <Routes>
          <Route path={`${urlBase}`} element={<HomePage />} />
          <Route path={`${urlBase}/repeat-by-variable`} element={<RepeatByVariablePage />} />
          <Route path={`${urlBase}/repeat-by-series`} element={<RepeatBySeriesPage />} />
          <Route path={`${urlBase}/dynamic-queries`} element={<DynamicQueriesPage />} />
          <Route path={`${urlBase}/dynamic-viz`} element={<DynamicVisualiationPage />} />
          <Route path={`${urlBase}/dynamic-vars`} element={<DynamicVariablesPage />} />
          <Route path={`${urlBase}/nested-context`} element={<NestedContextsPage />} />
          <Route path={`${urlBase}/interpolation-hook`} element={<InterpolationHookPage />} />
          <Route path={`${urlBase}/query-var-hook`} element={<UseQueryVariableHookPage />} />
          <Route path={`${urlBase}/drilldown`} element={<DrilldownDemoPage />} />
          <Route path={`${urlBase}/annotations`} element={<AnnotationDemoPage />} />
          <Route path={`${urlBase}/transformations`} element={<TransformationsDemoPage />} />
        </Routes>
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
        <TextLink href={`${urlBase}/query-var-hook`}>Query variable hook</TextLink>
        <TextLink href={`${urlBase}/drilldown`}>Drilldown demo</TextLink>
        <TextLink href={`${urlBase}/annotations`}>Annotations demo page</TextLink>
        <TextLink href={`${urlBase}/drilldown?from=now-5m&to=now&var-env=prod`}>
          Link with time range and variables
        </TextLink>
        <TextLink href={`${urlBase}/transformations`}>Transformation demo</TextLink>
      </Stack>
    </PageWrapper>
  );
}
