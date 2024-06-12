import React from 'react';
import { DemoVizLayout } from './utils';
import { PageWrapper } from './PageWrapper';
import { Stack } from '@grafana/ui';
import { AnnotationLayer, AnnotationPicker, SceneContextProvider } from '@grafana/scenes-react';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';

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
    <PageWrapper title="Annotations" subTitle="Annotation demo page">
      <AnnotationLayer name="GlobalAnno" query={globalQuery}>
        <Stack direction={'column'} gap={2}>
          <SceneContextProvider>
            <Stack direction="column">
              <Stack direction="row" justifyContent="flex-start">
                <AnnotationPicker />
              </Stack>
              <DemoVizLayout>
                <AnnotationLayer name="AnnoLayer1" query={query1}>
                  <AnnotationLayer name="AnnoLayer3" query={query3}>
                    <PlainGraphWithRandomWalk title="Plain graph 1" />
                  </AnnotationLayer>
                </AnnotationLayer>
              </DemoVizLayout>
            </Stack>
          </SceneContextProvider>
          <SceneContextProvider>
            <AnnotationPicker />
            <DemoVizLayout>
              <AnnotationLayer name="AnnoLayer2" query={query2}>
                <PlainGraphWithRandomWalk title="Plain graph 2" />
                <PlainGraphWithRandomWalk title="Plain graph 3" />
                <PlainGraphWithRandomWalk title="Plain graph 4" />
              </AnnotationLayer>
            </DemoVizLayout>
          </SceneContextProvider>
        </Stack>
      </AnnotationLayer>
    </PageWrapper>
  );
}
