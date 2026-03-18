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

export function getGroupByDatasource(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new GroupByVariable({
              name: 'groupBy',
              label: 'Group By (from datasource)',
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
                text: `Interpolated value (datasource): {$groupBy})`,
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
  });
}
