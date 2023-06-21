import {
  SceneGridLayout,
  EmbeddedScene,
  SceneGridItem,
  SceneAppPageState,
  SceneAppPage,
  PanelBuilders,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getLazyLoadDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Showcasing lazy rendering and query execution of panels that are outside viewport',
    getScene: () => {
      const panelIds = Array.from(Array(20).keys());
      const height = 6;
      const panel = PanelBuilders.timeseries().setData(
        getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' })
      );

      return new EmbeddedScene({
        body: new SceneGridLayout({
          children: panelIds.map(
            (id) =>
              new SceneGridItem({
                x: 0,
                y: id * height,
                width: 24,
                height: height,
                isResizable: true,
                isDraggable: true,
                body: panel.setTitle(`Panel ${id}`).build(),
              })
          ),
        }),
      });
    },
  });
}
