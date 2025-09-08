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
import { GRID_CELL_HEIGHT } from '@grafana/scenes/src/components/layout/grid/constants';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getGridLayoutTest(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
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
              body: PanelBuilders.timeseries()
                .setTitle('Draggable and resizable')
                .setOption('legend', { showLegend: false })
                .build(),
            }),
            new SceneGridItem({
              x: 12,
              y: 0,
              width: 12,
              height: 10,
              isResizable: false,
              isDraggable: false,
              body: PanelBuilders.timeseries()
                .setTitle('No drag and no resize')
                .setOption('legend', { showLegend: false })
                .build(),
            }),
            new SceneGridItem({
              x: 0,
              y: 11,
              width: 24,
              height: 10,
              isDraggable: false,
              isResizable: true,
              body: new SceneFlexLayout({
                direction: 'column',
                // Auto 100% height for SceneFlexLayout inside grid is not working, need to make grid item display: flex
                height: 10 * GRID_CELL_HEIGHT,
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
