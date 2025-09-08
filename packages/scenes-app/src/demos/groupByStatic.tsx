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

export function getGroupByStatic(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new GroupByVariable({
              name: 'groupBy',
              label: 'Group By MultiSelect (static list)',
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
            new GroupByVariable({
              name: 'groupByOneSelection',
              label: 'Group By OneSelection (static list)',
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
                text: `Interpolated value MultiSelect(static): {$groupBy}`,
                fontSize: 14,
              }),
            }),
            new SceneFlexItem({
              ySizing: 'content',
              body: new SceneCanvasText({
                text: `Interpolated value OneSelection (static): {$groupByOneSelection}`,
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
