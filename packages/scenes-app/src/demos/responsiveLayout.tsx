import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexItemState,
  SceneFlexLayout,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults, getRowWithText } from './utils';

export function getResponsiveLayoutDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
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

function getStatPanel(overrides?: Partial<SceneFlexItemState>) {
  return new SceneFlexItem({
    ...overrides,
    body: PanelBuilders.stat().setTitle('Stat').build(),
  });
}

function getTimeSeries(overrides?: Partial<SceneFlexItemState>, title?: string) {
  return new SceneFlexItem({
    ...overrides,
    body: PanelBuilders.timeseries()
      .setTitle(title ?? 'Panel')
      .build(),
  });
}
