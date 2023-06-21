import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneGridItem,
  SceneGridLayout,
  SceneQueryRunner,
  SplitLayout,
} from '@grafana/scenes';

export function getFlexBoxLayoutScene() {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries().setTitle('Time series').build(),
        }),
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Table').build(),
        }),
      ],
    }),
  });

  return scene;
}

export function getGridLayoutScene() {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
  });

  const scene = new EmbeddedScene({
    body: new SceneGridLayout({
      $data: queryRunner,
      children: [
        new SceneGridItem({
          x: 0,
          y: 0,
          width: 12,
          height: 10,
          isResizable: false,
          isDraggable: false,
          body: PanelBuilders.timeseries().setTitle('Time series').build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 0,
          width: 12,
          height: 10,
          isResizable: false,
          isDraggable: false,
          body: PanelBuilders.table().setTitle('Table').build(),
        }),
      ],
    }),
  });

  return scene;
}

export function getSplitLayoutScene() {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SplitLayout({
      direction: 'column',
      primary: PanelBuilders.timeseries().setTitle('Primary panel').build(),
      secondary: PanelBuilders.table().setTitle('Secondary panel').build(),
    }),
  });

  return scene;
}
