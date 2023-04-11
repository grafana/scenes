import {
  VizPanel,
  NestedScene,
  SceneTimePicker,
  SceneFlexLayout,
  SceneTimeRange,
  SceneFlexItem,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getNestedScene(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Example of a scene containing a NestedScene component.',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery(),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                key: '3',
                pluginId: 'timeseries',
                title: 'Panel 3',
              }),
            }),
            new SceneFlexItem({
              body: getInnerScene('Inner scene'),
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
    canRemove: true,
    canCollapse: true,
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          body: new VizPanel({
            key: '3',
            pluginId: 'timeseries',
            title: 'Data',
          }),
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
    actions: [new SceneTimePicker({})],
  });

  return scene;
}
