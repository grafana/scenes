import {
  SceneGridLayout,
  SceneGridItem,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
  PanelBuilders,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getGridLayoutTest(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Demo of the SceneGridLayout',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery(),
        body: new SceneGridLayout({
          isLazy: true,
          isDraggable: true,
          isResizable: true,
          children: [
            new SceneGridItem({
              x: 0,
              y: 0,
              width: 12,
              height: 10,
              isResizable: true,
              isDraggable: true,
              body: PanelBuilders.timeseries().setTitle('Draggable and resizable').build(),
            }),
            new SceneGridItem({
              x: 12,
              y: 0,
              width: 12,
              height: 10,
              isResizable: false,
              isDraggable: false,
              body: PanelBuilders.timeseries().setTitle('No drag and no resize').build(),
            }),
          ],
        }),
      });
    },
  });
}
