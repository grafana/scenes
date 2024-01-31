import {
  SceneFlexLayout,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneQueryRunner,
  AggregationsSet,
  SceneCanvasText,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getGroupByDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'TODO description',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        controls: [
          new AggregationsSet({
            name: 'Group',
            datasource: { uid: 'gdev-prometheus' },
            defaultOptions: [
              {
                text: 'foo',
              },
              {
                text: 'bar',
              },
              {
                text: 'baz',
              },
            ],
          }),
          // new AggregationsSet({
          //   name: 'Group By (async)',
          //   // Only want keys for this series
          //   datasource: { uid: 'gdev-prometheus' },
          // }),
          ...getEmbeddedSceneDefaults().controls,
        ],
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              ySizing: 'content',
              body: new SceneCanvasText({
                text: `The query below is interpolated to ALERTS{$Group}`,
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
