import {
  SceneFlexLayout,
  SceneFlexItem,
  SceneQueryRunner,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
  PanelBuilders,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { getEmbeddedSceneDefaults } from './utils';

export function getPanelContextDemoScene(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              height: 400,
              body: PanelBuilders.timeseries()
                .setData(getQueryRunnerFor3SeriesWithLabels())
                .setTitle('Check legend visibility actions, and color change')
                .setDisplayName('${__field.labels.cluster}')
                .build(),
            }),
            new SceneFlexItem({
              height: 400,
              body: PanelBuilders.text().setOption('content', 'from: ${__from:date:iso} to: ${__to:date:iso}').build(),
            }),
          ],
        }),
      });
    },
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
