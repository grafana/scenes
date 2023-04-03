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
import { DATASOURCE_REF } from '../../../constants';

export function getPanelContextDemoScene(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: 400,
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
    datasource: DATASOURCE_REF,
    queries: [
      {
        labels: 'cluster=eu',
        refId: 'A',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
      {
        hide: false,
        labels: 'cluster=us',
        refId: 'B',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
      {
        hide: false,
        labels: 'cluster=asia',
        refId: 'C',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
    ],
  });
}
