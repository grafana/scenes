import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  TestVariable,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  VariableValueSelectors,
  SceneByVariableRepeater,
  VariableValueOption,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getVariableRepeaterDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    $timeRange: new SceneTimeRange(),
    getScene: () => {
      return new EmbeddedScene({
        controls: [new VariableValueSelectors({})],
        $variables: new SceneVariableSet({
          variables: [
            new TestVariable({
              name: 'server',
              query: 'A.*',
              value: 'server',
              text: '',
              description: 'Server name',
              delayMs: 1000,
              includeAll: true,
              defaultToAll: true,
              isMulti: true,
              options: [],
            }),
          ],
        }),
        body: new SceneByVariableRepeater({
          variableName: 'server',
          body: new SceneFlexLayout({
            direction: 'column',
            children: [],
          }),
          getLayoutChild: (option) => getGraphAndTextPanel(option),
        }),
      });
    },
  });
}

function getGraphAndTextPanel(option: VariableValueOption) {
  return new SceneFlexLayout({
    minHeight: 200,
    children: [
      new SceneFlexItem({
        body: PanelBuilders.timeseries()
          .setTitle(`server: ${option.value}`)
          .setData(
            getQueryRunnerWithRandomWalkQuery({
              alias: `server: ${option.value}`,
            })
          )
          .build(),
      }),
      new SceneFlexItem({
        body: PanelBuilders.stat().setTitle('Max').setData(getQueryRunnerWithRandomWalkQuery({})).build(),
      }),
    ],
  });
}
