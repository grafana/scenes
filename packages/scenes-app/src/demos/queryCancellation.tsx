import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getQueryCancellationTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Demo of query cancellation',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        $data: getQueryRunnerWithRandomWalkQuery(
          { scenarioId: 'slow_query', stringInput: '15s' },
          { maxDataPointsFromWidth: false }
        ),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  minWidth: '25%',
                  body: new VizPanel({
                    pluginId: 'timeseries',
                    title: 'Global query',
                  }),
                }),
                new SceneFlexItem({
                  minWidth: '25%',
                  body: new VizPanel({
                    $data: getQueryRunnerWithRandomWalkQuery(
                      { scenarioId: 'slow_query', stringInput: '15s' },
                      { maxDataPointsFromWidth: false }
                    ),
                    pluginId: 'timeseries',
                    title: 'Local query',
                  }),
                }),
                new SceneFlexItem({
                  minWidth: '25%',
                  body: new VizPanel({
                    pluginId: 'stat',
                    title: 'Local query via transformation',
                    $data: new SceneDataTransformer({
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
                    }),
                  }),
                }),
                new SceneFlexItem({
                  minWidth: '25%',
                  body: new VizPanel({
                    pluginId: 'stat',
                    title: 'Global query via transformation',
                    $data: new SceneDataTransformer({
                      transformations: [
                        {
                          id: 'reduce',
                          options: {
                            reducers: ['mean'],
                          },
                        },
                      ],
                    }),
                  }),
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
