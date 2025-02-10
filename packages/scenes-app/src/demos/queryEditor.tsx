import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { QueryEditor } from '../components/QueryEditor/QueryEditor';

export function getQueryEditorDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
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
              body: PanelBuilders.timeseries().setTitle('Timeseries').build(),
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
