import {
    VizPanel,
    SceneTimePicker,
    SceneGridLayout,
    SceneTimeRange,
    EmbeddedScene,
    SceneGridItem,
  } from '@grafana/scenes';
  import { getQueryRunnerWithRandomWalkQuery } from '../utils';
  
  export function getLazyLoadDemo(): EmbeddedScene {
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
              title: 'Child of grid layout',
              isDraggable: false,
              isResizable: false,
            }),
          }),
          new SceneGridItem({
            x: 0,
            y: 10,
            width: 12,
            height: 10,
            isResizable: false,
            isDraggable: false,
            body: new VizPanel({
              pluginId: 'timeseries',
              title: 'Child of grid layout',
              isDraggable: false,
              isResizable: false,
            }),
          }),
          new SceneGridItem({
            x: 0,
            y: 20,
            width: 12,
            height: 10,
            isResizable: false,
            isDraggable: false,
            body: new VizPanel({
              pluginId: 'timeseries',
              title: 'Child of grid layout',
              isDraggable: false,
              isResizable: false,
            }),
          }),
          new SceneGridItem({
            x: 0,
            y: 30,
            width: 12,
            height: 10,
            isResizable: false,
            isDraggable: false,
            body: new VizPanel({
              pluginId: 'timeseries',
              title: 'Child of grid layout',
              isDraggable: false,
              isResizable: false,
            }),
          }),
          new SceneGridItem({
            x: 0,
            y: 40,
            width: 12,
            height: 10,
            isResizable: false,
            isDraggable: false,
            body: new VizPanel({
              pluginId: 'timeseries',
              title: 'Lazy',
              isDraggable: false,
              isResizable: false,
            }),
            $data: getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' }),
          }),
        ],
      }),
      $timeRange: new SceneTimeRange(),
      $data: getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' }),
      controls: [new SceneTimePicker({})],
    });
  }
