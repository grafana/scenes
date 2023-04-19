import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneCanvasText,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getFlexLayoutTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A simple demo of different flex layout options',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  minWidth: '70%',
                  body: new VizPanel({
                    pluginId: 'timeseries',
                    title: 'Dynamic height and width',
                    $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }),
                  }),
                }),
                new SceneFlexLayout({
                  $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 50 }),
                  direction: 'column',
                  children: [
                    new SceneFlexItem({
                      body: new VizPanel({
                        pluginId: 'timeseries',
                        title: 'Fill height',
                      }),
                    }),
                    new SceneFlexItem({
                      ySizing: 'content',
                      body: new SceneCanvasText({
                        text: 'Size to content',
                        fontSize: 20,
                        align: 'center',
                      }),
                    }),
                    new SceneFlexItem({
                      height: 300,
                      body: new VizPanel({
                        pluginId: 'stat',
                        title: 'Fixed height',
                      }),
                    }),
                  ],
                }),
              ],
            }),
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  width: 150,
                  height: 150,
                  body: new VizPanel({
                    pluginId: 'text',
                    title: '150x150',
                    options: { content: '' },
                  }),
                }),
                new SceneFlexItem({
                  maxHeight: 200,
                  body: new VizPanel({
                    title: 'maxHeight 200',
                    pluginId: 'timeseries',
                    $data: getQueryRunnerWithRandomWalkQuery(),
                  }),
                }),
                new SceneFlexItem({
                  width: '10%',
                  body: new VizPanel({
                    pluginId: 'text',
                    title: 'Width 10%',
                    options: { content: '' },
                  }),
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
