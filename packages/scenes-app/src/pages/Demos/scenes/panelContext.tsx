import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneTimePicker,
  SceneFlexItem,
  EmbeddedScene,
  VizPanel,
  SceneQueryRunner,
  SceneRefreshPicker,
} from '@grafana/scenes';

export function getPanelContextDemoScene(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: 300,
          body: new VizPanel({
            title: 'Check legend visibility actions, and color change',
            $data: getQueryRunnerFor3SeriesWithLabels(),
            fieldConfig: {
              defaults: {
                displayName: '${__field.labels.cluster}',
              },
              overrides: [],
            },
          }),
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({}), new SceneRefreshPicker({})],
  });
}

export function getQueryRunnerFor3SeriesWithLabels() {
  return new SceneQueryRunner({
    datasource: {
      uid: 'gdev-testdata',
      type: 'testdata',
    },
    queries: [
      {
        datasource: {
          type: 'testdata',
          uid: 'PD8C576611E62080A',
        },
        labels: 'cluster=eu',
        refId: 'A',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
      {
        datasource: {
          type: 'testdata',
          uid: 'PD8C576611E62080A',
        },
        hide: false,
        labels: 'cluster=us',
        refId: 'B',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
      {
        datasource: {
          type: 'testdata',
          uid: 'PD8C576611E62080A',
        },
        hide: false,
        labels: 'cluster=asia',
        refId: 'C',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
    ],
  });
}
