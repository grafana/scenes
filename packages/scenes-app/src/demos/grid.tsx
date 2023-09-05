import {
  SceneGridLayout,
  SceneGridItem,
  SceneFlexLayout,
  SceneFlexItem,
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
          isDraggable: true,
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

            new SceneGridItem({
              x: 6,
              y: 11,
              width: 12,
              height: 10,
              isDraggable: false,
              isResizable: true,
              body: new SceneFlexLayout({
                direction: 'column',
                children: [
                  new SceneFlexItem({
                    body: PanelBuilders.timeseries().setTitle('Child of flex layout').build(),
                  }),
                  new SceneFlexItem({
                    body: PanelBuilders.timeseries().setTitle('Child of flex layout').build(),
                  }),
                ],
              }),
            }),
          ],
        }),
      });
    },
  });
}
