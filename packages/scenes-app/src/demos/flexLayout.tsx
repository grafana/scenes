import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCanvasText,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getFlexLayoutTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
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
                    title: 'Failing panel because of wrong panel id',
                    pluginId: 'this-plugin-does-not-exist',
                    $data: getQueryRunnerWithRandomWalkQuery({}),
                  }),
                }),
                new SceneFlexLayout({
                  $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 50 }),
                  direction: 'column',
                  children: [
                    new SceneFlexItem({
                      body: PanelBuilders.timeseries().setTitle('Fill height').build(),
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
                      body: PanelBuilders.stat().setTitle('Fixed height').build(),
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
                  body: PanelBuilders.text().setTitle('150x150').setOption('content', '').build(),
                }),
                new SceneFlexItem({
                  maxHeight: 200,
                  body: PanelBuilders.timeseries()
                    .setTitle('maxHeigh 200')
                    .setData(getQueryRunnerWithRandomWalkQuery())
                    .build(),
                }),
                new SceneFlexItem({
                  width: '10%',
                  body: PanelBuilders.text().setTitle('').setOption('content', '').build(),
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
