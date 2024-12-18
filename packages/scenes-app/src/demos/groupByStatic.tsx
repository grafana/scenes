import {
  SceneFlexLayout,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneQueryRunner,
  SceneCanvasText,
  SceneVariableSet,
  VariableValueSelectors,
  GroupByVariable,
  SceneTimeRange,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getGroupByStatic(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'GroupBy variable - static list-',
    tabs: [
      new SceneAppPage({
        title: 'Group By MultiSelect',
        url: `${defaults.url}/multi`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new GroupByVariable({
                  name: 'groupBy',
                  label: 'Group By MultiSelect',
                  datasource: { uid: 'gdev-prometheus' },
                  defaultOptions: [
                    {
                      text: 'instance',
                      value: 'instance',
                    },
                    {
                      text: 'job',
                      value: 'job',
                    },
                    {
                      text: 'alert_name',
                      value: 'alert_name',
                    },
                  ],
                }),
              ],
            }),
            controls: [new VariableValueSelectors({})],
            ...getEmbeddedSceneDefaults().controls,
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new SceneCanvasText({
                    text: `Interpolated value: {$groupBy}`,
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
                            expr: 'count(ALERTS)',
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
        title: 'Group By Single Select',
        url: `${defaults.url}/single`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new GroupByVariable({
                  name: 'groupByOneSelection',
                  label: 'Group By OneSelection',
                  datasource: { uid: 'gdev-prometheus' },
                  isMulti: false,
                  defaultOptions: [
                    {
                      text: 'schema',
                      value: 'schema',
                    },
                    {
                      text: 'instance',
                      value: 'instance',
                    },
                    {
                      text: 'job',
                      value: 'job',
                    },
                  ],
                }),
              ],
            }),
            controls: [new VariableValueSelectors({})],
            ...getEmbeddedSceneDefaults().controls,
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new SceneCanvasText({
                    text: `Interpolated value: {$groupByOneSelection}`,
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
                            expr: 'count(ALERTS)',
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
          const groupByVar = new GroupByVariable({
            applyMode: 'manual',
            datasource: { uid: 'gdev-prometheus' },
            defaultOptions: [
              {
                text: 'schema',
                value: 'schema',
              },
              {
                text: 'instance',
                value: 'instance',
              },
              {
                text: 'job',
                value: 'job',
              },
            ],
          });

          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [groupByVar],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new SceneCanvasText({
                    text: `Using groupBy in manual mode allows you to use it as a normal variable. The query below is interpolated to ALERTS{$groupBy}`,
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
                            expr: 'ALERTS{$groupBy}',
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
