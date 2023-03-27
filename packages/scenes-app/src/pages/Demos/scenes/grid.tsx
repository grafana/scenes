import {
  VizPanel,
  SceneTimePicker,
  SceneGridLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneGridItem,
  SceneFlexLayout,
  SceneFlexItem,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from '../utils';

export function getGridLayoutTest(): EmbeddedScene {
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
          child: new VizPanel({
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
          child: new VizPanel({
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
          child: new SceneFlexLayout({
            direction: 'column',
            children: [
              new SceneFlexItem({
                child: new VizPanel({
                  pluginId: 'timeseries',
                  title: 'Child of flex layout',
                }),
              }),
              new SceneFlexItem({
                child: new VizPanel({
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
}
