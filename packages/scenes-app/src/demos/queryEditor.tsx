import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { QueryEditor } from '../components/QueryEditor/QueryEditor';

export function getQueryEditorDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Example of how to to build a component that uses the QueryEditor',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              ySizing: 'content',
              body: new QueryEditor(),
            }),
            new SceneFlexItem({
              body: new VizPanel({
                pluginId: 'timeseries',
                title: 'Timeseries',
              }),
              minHeight: 400,
              minWidth: '40%',
            }),
          ],
        }),
        $data: getQueryRunnerWithRandomWalkQuery(),
      });
    },
  });
}
