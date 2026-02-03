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
import { FlexLayoutDemoPage } from './FlexLayoutDemoPage';
import { UseAdHocFiltersVariableHookPage } from './UseAdHocFiltersVariableHookPage';
import { UseGroupByVariableHookPage } from './UseGroupByVariableHookPage';
import { UseLocalValueVariableHookPage } from './UseLocalValueVariableHookPage';

export function ReactDemoPage() {
  return (
    <SceneContextProvider timeRange={{ from: 'now-1h', to: 'now' }} withQueryController>
      <CustomVariable name="env" query="dev, test, prod" initialValue="dev">
        <Routes>
          <Route path="" Component={HomePage} />
          <Route path={`/repeat-by-variable`} Component={RepeatByVariablePage} />
          <Route path={`/repeat-by-series`} Component={RepeatBySeriesPage} />
          <Route path={`/dynamic-queries`} Component={DynamicQueriesPage} />
          <Route path={`/dynamic-viz`} Component={DynamicVisualiationPage} />
          <Route path={`/dynamic-vars`} Component={DynamicVariablesPage} />
          <Route path={`/nested-context`} Component={NestedContextsPage} />
          <Route path={`/interpolation-hook`} Component={InterpolationHookPage} />
          <Route path={`/query-var-hook`} Component={UseQueryVariableHookPage} />
          <Route path={`/flex-layout`} Component={FlexLayoutDemoPage} />
          <Route path={`/adhoc-var-hook`} Component={UseAdHocFiltersVariableHookPage} />
          <Route path={`/groupby-var-hook`} Component={UseGroupByVariableHookPage} />
          <Route path={`/local-var-hook`} Component={UseLocalValueVariableHookPage} />
          <Route path={`/drilldown/*`} Component={DrilldownDemoPage} />
          <Route path={`/annotations`} Component={AnnotationDemoPage} />
          <Route path={`/transformations`} Component={TransformationsDemoPage} />
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
        <TextLink href={`${urlBase}/flex-layout`}>Flex layout (scenes-react)</TextLink>
        <TextLink href={`${urlBase}/adhoc-var-hook`}>Ad hoc filters hook</TextLink>
        <TextLink href={`${urlBase}/groupby-var-hook`}>Group by hook</TextLink>
        <TextLink href={`${urlBase}/local-var-hook`}>Local value hook</TextLink>
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
