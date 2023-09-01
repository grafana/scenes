import { VariableRefresh } from '@grafana/data';
import {
  SceneTimeRange,
  VariableValueSelectors,
  SceneVariableSet,
  TestVariable,
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneGridLayout,
  SceneGridItem,
  SceneGridItemRepeater,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function gridItemRepeaterDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Testing repeating grid items by variable',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new TestVariable({
              name: 'server',
              query: 'A.*',
              value: 'server',
              text: '',
              delayMs: 1000,
              options: [],
              isMulti: true,
              refresh: VariableRefresh.onDashboardLoad,
            }),
          ],
        }),
        body: new SceneGridLayout({
          isDraggable: true,
          isResizable: true,
          children: [
            new SceneGridItemRepeater({
              variableName: 'server',
              repeats: [],
              x: 0,
              y: 0,
              width: 12,
              height: 8,
              source: new SceneGridItem({
                x: 0,
                y: 0,
                height: 8,
                width: 12,
                body: PanelBuilders.timeseries()
                  .setTitle('server = $server')
                  .setIsDraggable(true)
                  .setData(getQueryRunnerWithRandomWalkQuery({ alias: 'server = $server' }))
                  .build(),
              }),
            }),
            new SceneGridItem({
              x: 0,
              y: 8,
              height: 8,
              width: 12,
              body: PanelBuilders.timeseries()
                .setTitle('Panel below')
                .setIsDraggable(true)
                .setData(getQueryRunnerWithRandomWalkQuery({}))
                .build(),
            }),
          ],
        }),
        $timeRange: new SceneTimeRange(),
        controls: [new VariableValueSelectors({}), ...getEmbeddedSceneDefaults().controls],
      });
    },
  });
}
