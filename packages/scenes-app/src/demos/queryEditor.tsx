import { EmbeddedScene, SceneAppPage, SceneFlexItem, SceneFlexLayout, VizPanel } from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { QueryEditor } from '../components/QueryEditor/QueryEditor';
import { demoUrl } from '../utils/utils.routing';

export function getQueryEditorDemo() {
  return new SceneAppPage({
    title: 'Query editor demo',
    subTitle: 'Example of how to to build a component that uses the QueryEditor',
    url: `${demoUrl('query-editor')}`,
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
