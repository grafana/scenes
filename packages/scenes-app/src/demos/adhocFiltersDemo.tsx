import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  AdHocFiltersVariable,
  SceneQueryRunner,
  QueryVariable,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getAdhocFiltersDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Test of adhoc variables',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new QueryVariable({
              name: 'cluster',
              datasource: { uid: 'gdev-prometheus' },
              query: { query: 'label_values(job)', refId: 'A' },
            }),
            new AdHocFiltersVariable({
              name: 'Filters',
              datasource: { uid: 'gdev-prometheus' },
              filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
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
        $timeRange: new SceneTimeRange(),
      });
    },
  });
}
