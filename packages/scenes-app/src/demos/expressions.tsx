import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  VizPanel,
} from '@grafana/scenes';

export function getExpressionsDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      const queryRunner = new SceneQueryRunner({
        queries: [
          {
            datasource: {
              type: 'testdata',
              uid: 'gdev-testdata',
            },
            refId: 'A',
            scenarioId: 'csv_metric_values',
            stringInput: '1,2,3,4,5',
          },
          {
            datasource: {
              type: 'testdata',
              uid: 'gdev-testdata',
            },
            hide: false,
            refId: 'B',
            scenarioId: 'csv_metric_values',
            stringInput: '2,2,2,2,2',
          },
          {
            datasource: {
              //   name: 'Expression',
              type: '__expr__',
              uid: '__expr__',
            },
            expression: '$A/$B',
            hide: false,
            refId: 'ExpressionQuery',
            type: 'math',
          },
        ],
      });
      return new EmbeddedScene({
        key: 'Flex layout embedded scene',
        $data: queryRunner,
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  minHeight: 300,
                  body: new VizPanel({
                    pluginId: 'timeseries',
                    title: 'Queries + Expression',
                  }),
                }),
                new SceneFlexItem({
                  minHeight: 300,
                  body: new VizPanel({
                    pluginId: 'timeseries',
                    title: 'Expression results only (transformed)',
                    $data: new SceneDataTransformer({
                      transformations: [
                        {
                          id: 'filterFieldsByName',
                          options: {
                            include: {
                              names: ['ExpressionQuery', 'Time'],
                            },
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
