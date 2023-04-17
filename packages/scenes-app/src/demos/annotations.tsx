import {
  AnnotationsQueryRunner,
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getAnnotationsDemo(defaults: SceneAppPageState) {
  const annotationsProviderKey = 'APK1';

  return new SceneAppPage({
    ...defaults,
    subTitle: 'Annotation queries on the dashboard level',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: new AnnotationsQueryRunner({
          key: annotationsProviderKey,
          queries: [
            {
              name: 'errors',
              datasource: DATASOURCE_REF,
              iconColor: 'red',
              enable: true,
            },
          ],
        }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                pluginId: 'timeseries',
                title: 'Time series',
                $data: getQueryRunnerWithRandomWalkQuery({}, { annotationsProviderKey }),
              }),
            }),
            new SceneFlexItem({
              body: new VizPanel({
                title: 'Time series',
                pluginId: 'timeseries',
                $data: getQueryRunnerWithRandomWalkQuery({}, { annotationsProviderKey }),
              }),
            }),
          ],
        }),
      });
    },
  });
}
