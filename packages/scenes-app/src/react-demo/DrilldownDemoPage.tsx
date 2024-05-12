import { useSceneQuery, RVizPanel, RVisualizationBuilders } from '@grafana/scenes';
import React from 'react';
import { DATASOURCE_REF } from '../constants';
import { PageWrapper } from './PageWrapper';
import { DemoVizLayout, urlBase } from './utils';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';

export function DrilldownDemoPage() {
  return (
    <Switch>
      <Route path={`${urlBase}/drilldown`} component={DrilldownHome} exact />
      <Route path={`${urlBase}/drilldown/lib/:lib`} component={DrilldownLibraryPage} />
    </Switch>
  );
}

export function DrilldownHome() {
  const dataProvider = useSceneQuery({
    queries: [
      {
        scenarioId: 'csv_file',
        refId: 'A',
        csvFileName: 'js_libraries.csv',
      },
    ],
    datasource: DATASOURCE_REF,
  });

  return (
    <PageWrapper title="Drilldown demo" subTitle="The top level page (for the demo)">
      <DemoVizLayout>
        <RVizPanel title="JS Libraries" dataProvider={dataProvider} viz={tableWithDrilldown} />
      </DemoVizLayout>
    </PageWrapper>
  );
}

export function DrilldownLibraryPage(props: RouteComponentProps<{ lib: string }>) {
  const libraryName = props.match.params.lib;

  return (
    <PageWrapper title={`Library: ${libraryName}`} subTitle="Library details drilldown page">
      <DemoVizLayout>
        <PlainGraphWithRandomWalk title={`${libraryName} trends`} />
      </DemoVizLayout>
    </PageWrapper>
  );
}

export const tableWithDrilldown = RVisualizationBuilders.table()
  .setOverrides((b) =>
    b.matchFieldsWithName('Library').overrideLinks([
      {
        title: 'Go to library details',
        url: '${__url.path}/lib/${__value.text}',
      },
    ])
  )
  .build();
