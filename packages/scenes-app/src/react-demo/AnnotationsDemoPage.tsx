import React from 'react';
import { DemoVizLayout } from './utils';
import { PageWrapper } from './PageWrapper';
import { Stack } from '@grafana/ui';
import { AnnotationLayer, DataLayerControl, SceneContextProvider } from '@grafana/scenes-react';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function AnnotationDemoPage() {
  const query1 = {
    datasource: {
      type: 'testdata',
      uid: 'gdev-testdata',
    },
    enable: true,
    iconColor: 'yellow',
    name: 'New annotation',
    target: {
      // @ts-ignore
      lines: 10,
      refId: 'Anno',
      scenarioId: 'annotations',
    },
  };

  const query2 = {
    datasource: {
      type: 'testdata',
      uid: 'gdev-testdata',
    },
    enable: true,
    iconColor: 'red',
    name: 'New annotation',
    target: {
      // @ts-ignore
      lines: 15,
      refId: 'Anno',
      scenarioId: 'annotations',
    },
  };

  const query3 = {
    datasource: {
      type: 'testdata',
      uid: 'gdev-testdata',
    },
    enable: true,
    iconColor: 'blue',
    name: 'New annotation',
    target: {
      // @ts-ignore
      lines: 3,
      refId: 'Anno',
      scenarioId: 'annotations',
    },
  };

  const globalQuery = {
    datasource: {
      type: 'testdata',
      uid: 'gdev-testdata',
    },
    enable: true,
    iconColor: 'green',
    name: 'New annotation',
    target: {
      // @ts-ignore
      lines: 11,
      refId: 'Anno',
      scenarioId: 'annotations',
    },
  };

  return (
    <PageWrapper
      title="Annotations"
      subTitle={
        <DemoSubTitle
          text={'Annotation demo page'}
          getSourceCodeModule={() => import('!!raw-loader!./AnnotationsDemoPage')}
        />
      }
    >
      <AnnotationLayer name="GlobalAnno" query={globalQuery}>
        <Stack direction={'column'} gap={2}>
          <SceneContextProvider>
            <Stack direction="column">
              <AnnotationLayer name="AnnoLayer1" query={query1}>
                <AnnotationLayer name="AnnoLayer3" query={query3}>
                  <Stack direction="row">
                    <DataLayerControl name="GlobalAnno" />
                    <DataLayerControl name="AnnoLayer1" />
                    <DataLayerControl name="AnnoLayer3" />
                  </Stack>
                  <DemoVizLayout>
                    <PlainGraphWithRandomWalk title="Plain graph 1" />
                  </DemoVizLayout>
                </AnnotationLayer>
              </AnnotationLayer>
            </Stack>
          </SceneContextProvider>
          <SceneContextProvider>
            <AnnotationLayer name="AnnoLayer2" query={query2}>
              <DataLayerControl name="AnnoLayer2" />
              <DemoVizLayout>
                <PlainGraphWithRandomWalk title="Plain graph 2" />
                <PlainGraphWithRandomWalk title="Plain graph 3" />
                <PlainGraphWithRandomWalk title="Plain graph 4" />
              </DemoVizLayout>
            </AnnotationLayer>
          </SceneContextProvider>
        </Stack>
      </AnnotationLayer>
    </PageWrapper>
  );
}
