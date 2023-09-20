import {
  SceneFlexLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  behaviors,
  PanelBuilders,
  SceneQueryRunner,
  SceneVariableSet,
  QueryVariable,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getGoupByActionDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Test of panel level group by variable',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          direction: 'row',
          $behaviors: [
            new behaviors.ActWhenVariableChanged({
              variableName: 'server',
              onChange: (variable) => {
                console.log('server effect', variable);
              },
            }),
          ],
          children: [
            new SceneFlexItem({
              maxHeight: 500,
              body: PanelBuilders.timeseries()
                .setTitle('HTTP Requests')
                .setData(
                  new SceneQueryRunner({
                    queries: [
                      {
                        refId: 'A',
                        datasource: { uid: 'gdev-prometheus' },
                        expr: 'sum(rate(grafana_http_request_duration_seconds_bucket[$__rate_interval])) by ($groupby)',
                      },
                    ],
                  })
                )
                .setVariables(
                  new SceneVariableSet({
                    variables: [
                      new QueryVariable({
                        name: 'groupby',
                        label: 'Group by',
                        datasource: { uid: 'gdev-prometheus' },
                        query: 'label_names(grafana_http_request_duration_seconds_bucket)',
                        value: '',
                        text: '',
                        lazyValue: '',
                        includeNoValue: true,
                      }),
                    ],
                  })
                )
                .setHeaderActions([new VariableValueSelectors({})])
                .build(),
            }),
            new SceneFlexItem({
              maxHeight: 500,
              body: PanelBuilders.timeseries()
                .setTitle('GC Duration')
                .setData(
                  new SceneQueryRunner({
                    queries: [
                      {
                        refId: 'A',
                        datasource: { uid: 'gdev-prometheus' },
                        expr: 'sum(rate(go_gc_duration_seconds[$__rate_interval])) by ($groupby)',
                      },
                    ],
                  })
                )
                .setVariables(
                  new SceneVariableSet({
                    variables: [
                      new QueryVariable({
                        name: 'groupby',
                        label: 'Group by',
                        datasource: { uid: 'gdev-prometheus' },
                        query: 'label_names(go_gc_duration_seconds)',
                        value: '',
                        text: '',
                        lazyValue: '',
                        includeNoValue: true,
                      }),
                    ],
                  })
                )
                .setHeaderActions([new VariableValueSelectors({})])
                .build(),
            }),
          ],
        }),
        $timeRange: new SceneTimeRange(),
      });
    },
  });
}
