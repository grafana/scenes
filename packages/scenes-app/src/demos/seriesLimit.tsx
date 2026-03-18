import { EmbeddedScene, SceneAppPage, SceneAppPageState, SceneCSSGridLayout, VizPanel } from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getSeriesLimitTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneCSSGridLayout({
          children: [
            new VizPanel({
              title: 'Many series',
              pluginId: 'timeseries',
              seriesLimit: 20,
              $data: getQueryRunnerWithRandomWalkQuery({ seriesCount: 50 }),
            }),
          ],
        }),
      });
    },
  });
}
