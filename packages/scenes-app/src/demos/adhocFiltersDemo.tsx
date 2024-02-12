import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneQueryRunner,
  AdHocFiltersVariable,
  SceneCanvasText,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getAdhocFiltersDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: `Adhoc filters variable can be used in auto mode. By default datasources will apply the filters automatically to all queries of the same data source.
     In manual mode you can use it as a normal variable in queries or use it programmtically.
    `,
    tabs: [
      new SceneAppPage({
        title: 'Apply mode auto',
        url: `${defaults.url}/auto`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new AdHocFiltersVariable({
                  name: 'Filters',
                  // Only want keys for this series
                  baseFilters: [{ key: '__name__', operator: '=', value: 'ALERTS', condition: '' }],
                  datasource: { uid: 'gdev-prometheus' },
                }),
              ],
            }),
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
          });
        },
      }),
      new SceneAppPage({
        title: 'Apply mode manual',
        url: `${defaults.url}/manual`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new AdHocFiltersVariable({
                  applyMode: 'manual',
                  datasource: { uid: 'gdev-prometheus' },
                  filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new SceneCanvasText({
                    text: `Using AdHocFilterSet in manual mode allows you to use it as a normal variable. The query below is interpolated to ALERTS{$Filters}`,
                    fontSize: 14,
                  }),
                }),
                new SceneFlexItem({
                  body: PanelBuilders.table()
                    .setTitle('ALERTS')
                    .setData(
                      new SceneQueryRunner({
                        datasource: { uid: 'gdev-prometheus' },
                        queries: [
                          {
                            refId: 'A',
                            expr: 'ALERTS{$Filters}',
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
    ],
  });
}
