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
              'Row with maxHeight 150, and minHeight 150. Overriding default responsive rule to maintain row layout even on smaller screens'
            ),
            new SceneFlexLayout({
              direction: 'row',
              maxHeight: 150,
              minHeight: 150,
              children: [getStatPanel({}), getStatPanel({})],
              screenSmall: {
                direction: 'row',
              },
            }),
            getRowWithText(
              'Row with maxHeight 150,and minHeight 150. Default responsive behavior of switching to column layout and removing maxHeight constraint'
            ),
            new SceneFlexLayout({
              direction: 'row',
              maxHeight: 150,
              minHeight: 150,
              children: [getStatPanel({ minHeight: 100 }), getStatPanel({}), getStatPanel({})],
            }),
            getRowWithText(
              'Row with minHeight 200, and width constraints. The responsive style will remove the maxWidth by default'
            ),
            new SceneFlexLayout({
              direction: 'row',
              minHeight: 200,
              children: [getTimeSeries({}, 'No constraints'), getTimeSeries({ maxWidth: 300 }, 'maxWidth 300')],
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
