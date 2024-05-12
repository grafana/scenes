import { useSceneQuery, RVizPanel, RVisualizationBuilders } from '@grafana/scenes';
import { Stack } from '@grafana/ui';
import React from 'react';
import { DATASOURCE_REF } from '../constants';
import { PageWrapper } from './PageWrapper';
import { plainGraph } from './visualizations';
import { DemoVizLayout } from './utils';

export function DrilldownDemoPage() {
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
        <RVizPanel title="JS Libraries" dataProvider={dataProvider} viz={plainGraph} />
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
