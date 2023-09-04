import {
  AnnotationsLayer,
  CompositeQueryRunner,
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDataLayersTestTest(defaults: SceneAppPageState) {
  const globalAnnotations = new AnnotationsLayer({
    queries: [
      {
        datasource: {
          type: 'testdata',
          uid: 'gdev-testdata',
        },
        enable: true,
        iconColor: 'yellow',
        name: 'New annotation',
        target: {
          lines: 3,
          refId: 'Anno',
          scenarioId: 'annotations',
        } as any,
      },
    ],
  });

  // const globalAnnotations1 = new AnnotationsLayer({
  //   queries: [
  //     {
  //       datasource: {
  //         type: 'testdata',
  //         uid: 'gdev-testdata',
  //       },
  //       enable: true,
  //       iconColor: 'yellow',
  //       name: 'New annotation',
  //       target: {
  //         lines: 3,
  //         refId: 'Anno',
  //         scenarioId: 'annotations',
  //       } as any,
  //     },
  //   ],
  // });

  const nestedAnnotationsLayer = new AnnotationsLayer({
    queries: [
      {
        datasource: {
          type: 'testdata',
          uid: 'gdev-testdata',
        },
        enable: true,
        iconColor: 'blue',
        name: 'New annotation',
        target: {
          lines: 5,
          refId: 'Anno',
          scenarioId: 'annotations',
        } as any,
      },
    ],
  });

  return new SceneAppPage({
    ...defaults,
    subTitle: 'A simple demo of different flex layout options',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Multiple annotations layers',
        body: new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              // $dataLayers: [globalAnnotations],
              $data: new CompositeQueryRunner({
                runners: [
                  getQueryRunnerWithRandomWalkQuery({}),
                  getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' }),
                  globalAnnotations as any,
                  nestedAnnotationsLayer,
                ],
              }),
              body: new VizPanel({
                title: 'Global annotations',
                pluginId: 'timeseries',
              }),
            }),
            // new SceneFlexItem({
            //   $dataLayers: [globalAnnotations1],
            //   body: new VizPanel({
            //     $dataLayers: [nestedAnnotationsLayer],
            //     title: 'Combined annotations layer',
            //     pluginId: 'timeseries',
            //     $data: getQueryRunnerWithRandomWalkQuery({}),
            //   }),
            // }),
            // new SceneFlexItem({
            //   body: new VizPanel({
            //     $dataLayers: [nestedAnnotationsLayer],
            //     title: 'Nested annotations layer',
            //     pluginId: 'timeseries',
            //     $data: getQueryRunnerWithRandomWalkQuery({}),
            //   }),
            // }),
          ],
        }),
      });
    },
  });
}
