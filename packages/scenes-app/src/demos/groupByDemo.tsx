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
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getGroupByDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'TODO description',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            // new GroupByVariable({
            //   name: 'groupByStatic',
            //   label: 'Group By (static list)',
            //   datasource: { uid: 'gdev-prometheus' },
            //   defaultOptions: [
            //     {
            //       text: 'foo',
            //       value: 'foo',
            //     },
            //     {
            //       text: 'bar',
            //       value: 'bar',
            //     },
            //     {
            //       text: 'baz',
            //       value: 'baz',
            //     },
            //   ],
            // }),
            new GroupByVariable({
              name: 'groupBy',
              label: 'Group By (from data source)',
              datasource: { uid: 'gdev-prometheus' },
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
                text: `Interpolated value (static): {$groupByStatic},  interpolated value(dynamic): {$groupBy})`,
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
  });
}
