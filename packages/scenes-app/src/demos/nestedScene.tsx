import {
  VizPanel,
  NestedScene,
  SceneTimePicker,
  SceneFlexLayout,
  SceneTimeRange,
  SceneFlexItem,
  SceneAppPage,
  EmbeddedScene,
} from '@grafana/scenes';
import { demoUrl } from '../utils/utils.routing';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getNestedScene(): SceneAppPage {
  return new SceneAppPage({
    title: 'Nested scene ',
    subTitle: 'Example of a scene containing a NestedScene component.',
    url: `${demoUrl('nested-scene')}`,
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
