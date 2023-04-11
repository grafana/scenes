import {
  SceneFlexLayout,
  SceneFlexItem,
  VizPanel,
  SceneQueryRunner,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { getEmbeddedSceneDefaults } from './utils';

export function getPanelContextDemoScene(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Here you can test changing series color and toggle series visiblity. ',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
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
