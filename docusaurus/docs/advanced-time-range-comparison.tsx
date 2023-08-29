import {
  EmbeddedScene,
  SceneFlexLayout,
  SceneFlexItem,
  PanelBuilders,
  SceneQueryRunner,
  SceneTimeRange,
  SceneTimePicker,
  SceneTimeRangeCompare,
} from '@grafana/scenes';

export function getAdvancedTimeRangeComparisonScene() {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{handler=~"/metrics"}[5m])',
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
    controls: [new SceneTimePicker({}), new SceneTimeRangeCompare({})],
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          width: '100%',
          height: '100%',
          body: PanelBuilders.timeseries().setTitle('Panel using global time range').build(),
        }),
      ],
    }),
  });

  return scene;
}
