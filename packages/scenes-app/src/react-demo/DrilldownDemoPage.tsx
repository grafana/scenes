import { VizConfigBuilders } from '@grafana/scenes';
import { Breadcrumb, BreadcrumbProvider, VizPanel, useQueryRunner } from '@grafana/scenes-react';
import React from 'react';
import { DATASOURCE_REF } from '../constants';
import { PageWrapper } from './PageWrapper';
import { DemoVizLayout, urlBase } from './utils';
import { Route, Routes, useParams } from 'react-router-dom';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function DrilldownDemoPage() {
  /**
   * The breadcrumb provider should really be wrapping all routes, but placing it here just to show the concept and so far this is the only pages that use it.
   * It needs to be above the PageWrapper as it's the the component that uses the BreadcrumbContext
   */
  return (
    <BreadcrumbProvider>
      <Breadcrumb text="Drilldown demo" path={`${urlBase}/drilldown`} />
      <Routes>
        <Route path="*" element={<DrilldownHome />} />
        <Route path="lib/:lib" element={<DrilldownLibraryPage />} />
      </Routes>
    </BreadcrumbProvider>
  );
}

export function DrilldownHome() {
  const dataProvider = useQueryRunner({
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
    <PageWrapper
      title="Drilldown demo"
      subTitle={
        <DemoSubTitle
          text={'The top level page (for the demo)'}
          getSourceCodeModule={() => import('!!raw-loader!./DrilldownDemoPage')}
        />
      }
    >
      <DemoVizLayout>
        <VizPanel title="JS Libraries" dataProvider={dataProvider} viz={tableWithDrilldown} />
      </DemoVizLayout>
    </PageWrapper>
  );
}

export function DrilldownLibraryPage() {
  const libraryName = useParams<{ lib: string }>().lib;

  return (
    <PageWrapper
      title={`Library: ${libraryName}`}
      subTitle={
        <DemoSubTitle
          text={'Library details drilldown page'}
          getSourceCodeModule={() => import('!!raw-loader!./DrilldownDemoPage')}
        />
      }
    >
      <DemoVizLayout>
        <PlainGraphWithRandomWalk title={`${libraryName} trends`} />
      </DemoVizLayout>
    </PageWrapper>
  );
}

export const tableWithDrilldown = VizConfigBuilders.table()
  .setOverrides((b) =>
    b.matchFieldsWithName('Library').overrideLinks([
      {
        title: 'Go to library details',
        url: '${__url.path}/lib/${__value.text}${__url.params}',
      },
    ])
  )
  .build();
