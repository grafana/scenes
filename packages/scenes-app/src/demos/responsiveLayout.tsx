import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneCanvasText,
  SceneFlexItem,
  SceneFlexItemState,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';

export function getResponsiveLayoutDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Show casing the default and custom responsive options of SceneFlexLayout',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 40 }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            getRowWithText(
              'Row with height 150, Default responsive behavior of switching to column layout and removing height constraint on layout. Height constraints are automatically also applied to children so they work when the media query switches the flex direction to column'
            ),
            new SceneFlexLayout({
              direction: 'row',
              height: 150,
              children: [getStatPanel({}), getStatPanel({}), getStatPanel({})],
            }),
            getRowWithText(
              'Row with height 20, Overriding default responsive rule to maintain row layout even on smaller screens but with only 100px height'
            ),
            new SceneFlexLayout({
              direction: 'row',
              height: 200,
              md: {
                height: 100,
                direction: 'row',
              },
              children: [getStatPanel({}), getStatPanel({})],
            }),
            getRowWithText(
              'Row with minHeight 300, and item with width constraint. The responsive style will remove the maxWidth by default'
            ),
            new SceneFlexLayout({
              direction: 'row',
              minHeight: 300,
              children: [
                getTimeSeries({}, 'No constraints'),
                new SceneFlexLayout({
                  direction: 'column',
                  maxWidth: 300,
                  children: [getTimeSeries({}, 'maxWidth 300'), getTimeSeries({}, 'maxWidth 300')],
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}

function getRowWithText(text: string) {
  return new SceneFlexItem({
    ySizing: 'content',
    body: new SceneCanvasText({
      text,
      fontSize: 12,
    }),
  });
}

function getStatPanel(overrides?: Partial<SceneFlexItemState>) {
  return new SceneFlexItem({
    ...overrides,
    body: new VizPanel({
      pluginId: 'stat',
      title: 'Stat',
    }),
  });
}

function getTimeSeries(overrides?: Partial<SceneFlexItemState>, title?: string) {
  return new SceneFlexItem({
    ...overrides,
    body: new VizPanel({
      pluginId: 'timeseries',
      title: title ?? 'Panel',
    }),
  });
}
