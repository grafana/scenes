import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
} from '@grafana/scenes';
import { TextMode } from '@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen';

export function getAdvancedActivationHandlers() {
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
        expr: 'rate(prometheus_http_requests_total[5m])',
      },
    ],
  });

  const debugView = PanelBuilders.text()
    .setTitle('Debug view')
    .setOption('mode', TextMode.HTML)
    .setOption('content', '')
    .build();

  queryRunner.addActivationHandler(() => {
    let log = '';

    const sub = queryRunner.subscribeToState((state) => {
      log =
        `${new Date(Date.now()).toLocaleTimeString()} Executed query: <pre>${state.queries.map(
          (q) => q.expr
        )}</pre>\n` + log;
      debugView.setState({
        options: {
          content: log,
        },
      });
    });

    // Return deactivation handler
    return () => {
      sub.unsubscribe();
    };
  });

  const scene = new EmbeddedScene({
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries().setTitle('Panel title').setData(queryRunner).build(),
        }),
        new SceneFlexItem({
          width: '30%',
          body: debugView,
        }),
      ],
    }),
  });

  return scene;
}
