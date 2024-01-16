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
  GroupByVariable,
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
        $variables: new SceneVariableSet({
          variables: [
            AdHocFiltersVariable.create({
              datasource: { uid: 'gdev-prometheus' },
              filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
            }),
            GroupByVariable.create({
              datasource: { uid: 'gdev-prometheus' },
              filters: [],
            })
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
  });
}
