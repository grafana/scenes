import { VariableRefresh } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  TestVariable,
  EmbeddedScene,
  SceneFlexItem,
  NestedScene,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  VariableValueSelectors,
  SceneTimePicker,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getNestedScenesAndVariablesDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    $variables: new SceneVariableSet({
      variables: [
        new TestVariable({
          name: 'server',
          query: 'A.*',
          value: 'server',
          text: '',
          delayMs: 2000,
          options: [],
        }),
        new TestVariable({
          name: 'notUsed',
          query: 'A.$A.*',
          value: 'server',
          text: '',
          delayMs: 5000,
          options: [],
        }),
      ],
    }),
    controls: [new VariableValueSelectors({})],
    tabs: [
      new SceneAppPage({
        title: 'Overview',
        url: `${defaults.url}/overview`,
        routePath: 'overview',
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new TestVariable({
                  name: 'pod',
                  query: 'A.$server.*',
                  value: 'pod',
                  delayMs: 2000,
                  isMulti: true,
                  text: '',
                  options: [],
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
                                .setData(getQueryRunnerWithRandomWalkQuery({ alias: 'handler: $pod' }))
                                .build(),
                            }),
                          ],
                        }),
                      }),
                      new SceneFlexItem({
                        body: getInnerScene('Inner scene1'),
                      }),
                    ],
                  }),
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

export function getInnerScene(title: string) {
  const scene = new NestedScene({
    title: title,
    canRemove: true,
    canCollapse: true,
    $variables: new SceneVariableSet({
      variables: [
        new TestVariable({
          name: 'handler',
          query: 'A.$server.$pod.*',
          value: 'pod',
          delayMs: 2000,
          isMulti: true,
          text: '',
          options: [],
          refresh: VariableRefresh.onTimeRangeChanged,
        }),
      ],
    }),
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries()
            .setTitle('handler: $handler')
            .setData(getQueryRunnerWithRandomWalkQuery({ alias: 'handler: $handler' }))
            .build(),
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
    controls: [new VariableValueSelectors({}), new SceneTimePicker({})],
  });

  return scene;
}
