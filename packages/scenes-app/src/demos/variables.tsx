import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  EmbeddedScene,
  SceneFlexItem,
  SceneCanvasText,
  NestedScene,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  QueryVariable,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getVariablesDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Test of variable cascading updates and refresh on time range change',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new QueryVariable({
              name: 'server',
              datasource: { uid: 'gdev-prometheus' },
              defaultToAll: true,
              includeAll: true,
              isMulti: true,
              allValue: '.*',
              query: { query: 'label_names(asdasd)' },
            }),
          ],
        }),
        body: new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: new SceneFlexLayout({
                direction: 'column',
                children: [
                  new SceneFlexItem({
                    body: new SceneFlexLayout({
                      children: [
                        new SceneFlexItem({
                          body: PanelBuilders.timeseries()
                            .setTitle('handler: $handler')
                            .setData(
                              getQueryRunnerWithRandomWalkQuery({
                                alias: 'handler: $handler',
                              })
                            )
                            .build(),
                        }),
                        new SceneFlexItem({
                          body: new SceneCanvasText({
                            text: 'Text: ${textbox}',
                            fontSize: 20,
                            align: 'center',
                          }),
                        }),
                        new SceneFlexItem({
                          width: '40%',
                          body: new SceneCanvasText({
                            text: 'server: ${server} pod:${pod}',
                            fontSize: 20,
                            align: 'center',
                          }),
                        }),
                      ],
                    }),
                  }),
                  new SceneFlexItem({
                    body: new NestedScene({
                      title: 'Collapsable inner scene',
                      canCollapse: true,
                      body: new SceneFlexLayout({
                        direction: 'row',
                        children: [
                          new SceneFlexItem({
                            body: PanelBuilders.timeseries()
                              .setTitle('handler: $handler')
                              .setData(
                                getQueryRunnerWithRandomWalkQuery({
                                  alias: 'handler: $handler',
                                })
                              )
                              .build(),
                          }),
                        ],
                      }),
                    }),
                  }),
                  new SceneFlexItem({
                    body: new NestedScene({
                      title: 'Collapsable variables that use built-in variables variants',
                      canCollapse: true,
                      body: new SceneFlexLayout({
                        direction: 'row',
                        children: [
                          new SceneFlexItem({
                            body: new SceneCanvasText({
                              text: 'Interval Variable: ${intervalVariable}',
                              fontSize: 20,
                              align: 'center',
                            }),
                          }),
                          new SceneFlexItem({
                            body: new SceneCanvasText({
                              text: 'Interval Variable Auto: ${intervalVariableAuto}',
                              fontSize: 20,
                              align: 'center',
                            }),
                          }),
                        ],
                      }),
                    }),
                  }),
                ],
              }),
            }),
          ],
        }),
        $timeRange: new SceneTimeRange(),
      });
    },
  });
}
