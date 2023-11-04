import {
  EmbeddedScene,
  PanelBuilders,
  QueryVariable,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';

export function getVariablesScene() {
  const handlers = new QueryVariable({
    name: 'handler',
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    query: {
      query: 'label_values(prometheus_http_requests_total,handler)',
      refId: 'A',
    },
  });

  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        range: true,
        format: 'time_series',
        expr: 'rate(prometheus_http_requests_total{handler="$handler"}[5m])',
      },
    ],
  });

  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [handlers],
    }),
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries().build(),
        }),
      ],
    }),
    controls: [new VariableValueSelectors({})],
  });

  return scene;
}
