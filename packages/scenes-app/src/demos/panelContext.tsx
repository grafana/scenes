import {
  SceneFlexLayout,
  SceneFlexItem,
  VizPanel,
  SceneQueryRunner,
  SceneAppPage,
  EmbeddedScene,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { demoUrl } from '../utils/utils.routing';
import { getEmbeddedSceneDefaults } from './utils';

export function getPanelContextDemoScene(): SceneAppPage {
  return new SceneAppPage({
    title: 'Panel context demo',
    subTitle: 'Here you can test changing series color and toggle series visiblity. ',
    url: `${demoUrl('panel-context')}`,
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
