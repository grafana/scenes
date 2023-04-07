import {
  VizPanel,
  SceneGridLayout,
  SceneGridItem,
  SceneFlexLayout,
  SceneFlexItem,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
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
          children: [
            new SceneGridItem({
              x: 0,
              y: 0,
              width: 12,
              height: 10,
              isResizable: true,
              isDraggable: true,
              body: new VizPanel({
                pluginId: 'timeseries',
                title: 'Draggable and resizable',
              }),
            }),
            new SceneGridItem({
              x: 12,
              y: 0,
              width: 12,
              height: 10,
              isResizable: false,
              isDraggable: false,
              body: new VizPanel({
                pluginId: 'timeseries',
                title: 'No drag and no resize',
                isDraggable: false,
                isResizable: false,
              }),
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
                    body: new VizPanel({
                      pluginId: 'timeseries',
                      title: 'Child of flex layout',
                    }),
                  }),
                  new SceneFlexItem({
                    body: new VizPanel({
                      pluginId: 'timeseries',
                      title: 'Child of flex layout',
                    }),
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
