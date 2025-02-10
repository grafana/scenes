import {
  SceneGridLayout,
  SceneGridRow,
  SceneGridItem,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
  PanelBuilders,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getGridWithRowLayoutTest(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery(),
        body: new SceneGridLayout({
          isDraggable: true,
          children: [
            new SceneGridRow({
              title: 'Row A',
              key: 'Row A',
              isCollapsed: true,
              isDraggable: true,
              isResizable: false,
              y: 0,
              x: 0,
              children: [
                new SceneGridItem({
                  x: 0,
                  y: 1,
                  width: 12,
                  height: 5,
                  isResizable: true,
                  isDraggable: true,
                  body: PanelBuilders.timeseries().setTitle('Row A Child1').build(),
                }),
                new SceneGridItem({
                  x: 0,
                  y: 5,
                  width: 6,
                  height: 5,
                  isResizable: true,
                  isDraggable: true,
                  body: PanelBuilders.timeseries().setTitle('Row A Child2').build(),
                }),
              ],
            }),
            new SceneGridRow({
              title: 'Row B',
              key: 'Row B',
              isCollapsed: true,
              y: 1,
              children: [
                new SceneGridItem({
                  x: 0,
                  y: 2,
                  width: 12,
                  height: 5,
                  isResizable: false,
                  isDraggable: true,
                  body: PanelBuilders.timeseries().setTitle('Row B Child1').build(),
                }),
                new SceneGridItem({
                  x: 0,
                  y: 7,
                  width: 6,
                  height: 5,
                  isResizable: false,
                  isDraggable: true,
                  body: PanelBuilders.timeseries().setTitle('Row B Child2').build(),
                }),
              ],
            }),
            new SceneGridItem({
              x: 2,
              y: 12,
              width: 12,
              height: 10,
              isResizable: true,
              isDraggable: true,
              body: PanelBuilders.timeseries().setTitle('Outsider').build(),
            }),
          ],
        }),
      });
    },
  });
}
