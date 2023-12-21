import {
  SceneFlexLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneFlexItem,
  NestedScene,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneTimePicker,
  SceneRefreshPicker,
  SceneCSSGridLayout,
  SceneControlsSpacer,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { SceneQueryController } from '@grafana/scenes/src/querying/SceneQueryController';

export function getQueryControllerDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Shows how to see query state of a sub scene and cancel all sub scene queries',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $behaviors: [new SceneQueryController({})],
        controls: [
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneRefreshPicker({ withText: true, primary: true }),
        ],
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              height: '320px',
              body: new SceneCSSGridLayout({
                autoRows: '320px',
                children: [
                  PanelBuilders.timeseries()
                    .setTitle('Panel 1')
                    .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '3s' }))
                    .build(),
                  PanelBuilders.timeseries()
                    .setTitle('Panel 2')
                    .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '3s' }))
                    .build(),
                ],
              }),
            }),
            new SceneFlexItem({
              body: getInnerScene('Inner scene1'),
            }),
          ],
        }),
      });
    },
  });
}

export function getInnerScene(title: string) {
  const scene = new NestedScene({
    title: title,
    canCollapse: true,
    body: new SceneCSSGridLayout({
      children: [
        PanelBuilders.timeseries()
          .setTitle('Panel 3')
          .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '3s' }))
          .build(),
        PanelBuilders.timeseries()
          .setTitle('Panel 4')
          .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '3s' }))
          .build(),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
    $behaviors: [new SceneQueryController({})],
    controls: [new SceneControlsSpacer(), new SceneTimePicker({}), new SceneRefreshPicker({ withText: true })],
  });

  return scene;
}
