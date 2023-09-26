import { VariableRefresh } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  TestVariable,
  EmbeddedScene,
  SceneFlexItem,
  SceneCanvasText,
  NestedScene,
  SceneAppPage,
  SceneAppPageState,
  behaviors,
  PanelBuilders,
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
            new TestVariable({
              name: 'server',
              query: 'A.*',
              value: 'server',
              text: '',
              delayMs: 1000,
              options: [],
              refresh: VariableRefresh.onTimeRangeChanged,
            }),
            new TestVariable({
              name: 'pod',
              query: 'A.$server.*',
              value: 'pod',
              delayMs: 1000,
              isMulti: true,
              text: '',
              options: [],
            }),
            new TestVariable({
              name: 'handler',
              query: 'A.$server.$pod.*',
              value: 'pod',
              delayMs: 1000,
              isMulti: true,
              text: '',
              options: [],
              refresh: VariableRefresh.onTimeRangeChanged,
            }),
            new TestVariable({
              name: 'lonelyOne',
              query: 'B.*',
              value: '',
              delayMs: 1000,
              isMulti: true,
              text: '',
              options: [],
            }),
          ],
        }),
        body: new SceneFlexLayout({
          direction: 'row',
          $behaviors: [
            new behaviors.ActWhenVariableChanged({
              variableName: 'lonelyOne',
              onChange: (variable) => {
                console.log('lonelyOne effect', variable);

                const t = setTimeout(() => {
                  console.log('lonelyOne post effect');
                }, 5000);

                return () => {
                  console.log('lonelyOne cancel effect');
                  clearTimeout(t);
                };
              },
            }),
            new behaviors.ActWhenVariableChanged({
              variableName: 'server',
              onChange: (variable) => {
                console.log('server effect', variable);
              },
            }),
          ],
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
