import {
  AnnotationsDataLayer,
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  VizPanel,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDataLayersTestTest(defaults: SceneAppPageState) {
  const globalAnnotations = new AnnotationsDataLayer({
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

  const nestedAnnotationsDataLayer = new AnnotationsDataLayer({
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

  const independentAnnotations = new AnnotationsDataLayer({
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
          lines: 30,
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
        $data: [globalAnnotations],
        body: new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              $data: getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' }),
              body: new VizPanel({
                title: 'Global annotations',
                pluginId: 'timeseries',
              }),
            }),
            new SceneFlexItem({
              $data: [nestedAnnotationsDataLayer],
              body: new VizPanel({
                $data: getQueryRunnerWithRandomWalkQuery({}),
                title: 'Combined annotations',
                pluginId: 'timeseries',
              }),
            }),
            new SceneFlexItem({
              $data: [nestedAnnotationsDataLayer],
              body: new VizPanel({
                $data: new SceneQueryRunner({
                  $data: [independentAnnotations],
                  queries: [
                    {
                      refId: 'A',
                      datasource: DATASOURCE_REF,
                      scenarioId: 'random_walk',
                    },
                  ],
                }),
                title: 'Combined annotations',
                pluginId: 'timeseries',
              }),
            }),
          ],
        }),
      });
    },
  });
}
