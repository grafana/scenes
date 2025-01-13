import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getQueryCancellationTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        $data: getQueryRunnerWithRandomWalkQuery(
          { scenarioId: 'slow_query', stringInput: '10s' },
          { maxDataPointsFromWidth: false }
        ),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  minWidth: '20%',
                  body: PanelBuilders.timeseries().setTitle('Global query').build(),
                }),
                new SceneFlexItem({
                  minWidth: '20%',
                  body: PanelBuilders.timeseries()
                    .setTitle('Local query')
                    .setData(
                      getQueryRunnerWithRandomWalkQuery(
                        { scenarioId: 'slow_query', stringInput: '10s' },
                        { maxDataPointsFromWidth: false }
                      )
                    )
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '20%',
                  body: PanelBuilders.stat()
                    .setTitle('Local query via transformation')
                    .setData(
                      new SceneDataTransformer({
                        $data: getQueryRunnerWithRandomWalkQuery(
                          { scenarioId: 'slow_query', stringInput: '15s' },
                          { maxDataPointsFromWidth: true }
                        ),
                        transformations: [
                          {
                            id: 'reduce',
                            options: {
                              reducers: ['mean'],
                            },
                          },
                        ],
                      })
                    )
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '20%',
                  body: PanelBuilders.stat()
                    .setTitle('Global query via transformation')
                    .setData(
                      new SceneDataTransformer({
                        transformations: [
                          {
                            id: 'reduce',
                            options: {
                              reducers: ['mean'],
                            },
                          },
                        ],
                      })
                    )
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '20%',
                  body: PanelBuilders.stat()
                    .setTitle('Transformed transformation')
                    .setData(
                      new SceneDataTransformer({
                        transformations: [
                          {
                            id: 'calculateField',
                            options: {
                              mode: 'binary',
                              reduce: {
                                reducer: 'sum',
                              },
                              binary: {
                                left: 'A-series',
                                reducer: 'sum',
                                operator: '*',
                                right: '2',
                              },
                            },
                          },
                        ],
                      })
                    )
                    .build(),
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
