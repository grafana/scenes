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
  AdHocFiltersVariable,
  SceneCanvasText,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getAdhocFiltersDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: `Adhoc filters can be used as a standalone component (AdHocFilterSet) added to a controls array. By default datasources will apply the filters automatically to all queries of the same data source.
     You can add filters via AdHocFiltersVariable added to a SceneVariableSet. Then it renders to a label filter expression you can use in specific queries.
    `,
    tabs: [
      new SceneAppPage({
        title: 'Automatically applied',
        url: `${defaults.url}/auto`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            controls: [
              new AdHocFilterSet({
                name: 'Filters',
                // Only want keys for this series
                baseFilters: [{ key: '__name__', operator: '=', value: 'ALERTS', condition: '' }],
                datasource: { uid: 'gdev-prometheus' },
              }),
              ...getEmbeddedSceneDefaults().controls,
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
          });
        },
      }),
      new SceneAppPage({
        title: 'As variable',
        url: `${defaults.url}/manual`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                AdHocFiltersVariable.create({
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
                    text: `Using AdHocFilterSet in manual mode and inside an AdHocFiltersVariable. The query below is interpolated to ALERTS{$Filters}`,
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
