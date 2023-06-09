import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneCanvasText,
  SplitLayout,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getSplitTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A simple demo of different flex layout options',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        body: new SplitLayout({
          direction: 'row',
          primary: new VizPanel({
            pluginId: 'timeseries',
            title: 'Dynamic height and width',
            $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }),
          }),
          secondary: new SplitLayout({
            ySizing: 'content',
            direction: 'column',
            primary: new SceneCanvasText({
              text: 'Size to content',
              fontSize: 20,
              align: 'center',
            }),
            secondary: new SceneCanvasText({
              text: 'Blah blah',
              fontSize: 30,
              align: 'center',
            }),
          }),
        }),
      });
    },
  });
}
