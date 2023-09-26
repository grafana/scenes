import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  AdHocFilterSet,
  SceneQueryRunner,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getAdhocFiltersDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Test of adhoc variables',
    tabs: [
      new SceneAppPage({
        title: 'Automatic',
        url: `${defaults.url}/auto`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            controls: [
              new AdHocFilterSet({
                name: 'Filters',
                datasource: { uid: 'gdev-prometheus' },
                filters: [{ key: 'job', operator: '=', value: 'grafana' }],
              }),
            ],
            body: new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.table()
                    .setTitle('ALERTS')
                    .setData(
                      new SceneQueryRunner({
                        datasource: { uid: 'gdev-prometheus' },
                        queries: [
                          {
                            refId: 'A',
                            expr: 'ALERTS',
                            format: 'table',
                            instant: true,
                          },
                        ],
                      })
                    )
                    .build(),
                }),
              ],
            }),
            $timeRange: new SceneTimeRange(),
          });
        },
      }),
      new SceneAppPage({
        title: 'Manual',
        url: `${defaults.url}/manual`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                // new AdHocFiltersVariable({
                //   name: 'Filters',
                //   datasource: { uid: 'gdev-prometheus' },
                //   filters: [{ key: 'job', operator: '=', value: 'grafana' }],
                // }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.text()
                    .setTitle('Text panel')
                    .setOption(
                      'content',
                      `Using adhoc filters in manual mode means you can use them in a query as a normal variable.

example: ALERTS{$Filters}`
                    )
                    .build(),
                }),
              ],
            }),
            $timeRange: new SceneTimeRange(),
          });
        },
      }),
    ],
  });
}
