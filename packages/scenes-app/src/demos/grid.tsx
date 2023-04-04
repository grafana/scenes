import {
  VizPanel,
  SceneTimePicker,
  SceneGridLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneGridItem,
  SceneFlexLayout,
  SceneFlexItem,
  SceneAppPage,
} from '@grafana/scenes';
import { demoUrl } from '../utils/utils.routing';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getGridLayoutTest(): SceneAppPage {
  return new SceneAppPage({
    title: 'Grid layout ',
    subTitle: 'Demo of the SceneGridLayout',
    url: `${demoUrl('grid-layout')}`,
    getScene: () => {
      return new EmbeddedScene({
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
        $timeRange: new SceneTimeRange(),
        $data: getQueryRunnerWithRandomWalkQuery(),
        controls: [new SceneTimePicker({})],
      });
    },
  });
}
