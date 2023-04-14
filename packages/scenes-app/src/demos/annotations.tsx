import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getAnnotationsDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Annotation queries on the dashboard level',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),

        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                pluginId: 'timeseries',
                title: 'Time series',
                $data: getQueryRunnerWithRandomWalkQuery({}),
              }),
            }),
            new SceneFlexItem({
              body: new VizPanel({
                title: 'Time series',
                pluginId: 'timeseries',
                $data: getQueryRunnerWithRandomWalkQuery(),
              }),
            }),
          ],
        }),
      });
    },
  });
}
