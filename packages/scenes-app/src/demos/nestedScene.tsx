import {
  NestedScene,
  SceneTimePicker,
  SceneFlexLayout,
  SceneTimeRange,
  SceneFlexItem,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
  PanelBuilders,
  SceneVariableSet,
  TestVariable,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getNestedScene(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    subTitle:
      'Example of a scene containing a NestedScene component. A nested scene that contains variables that depends on the parent scene variables is not supported yet',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery(),
        $variables: new SceneVariableSet({
          variables: [
            new TestVariable({
              name: 'server',
              query: 'A.*',
              value: 'server',
              text: '',
              delayMs: 1000,
              options: [],
            }),
          ],
        }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: PanelBuilders.timeseries().setTitle('Panel: server = $server').build(),
            }),
            new SceneFlexItem({
              body: getInnerScene('Inner scene'),
            }),
          ],
        }),
      });
    },
  });
}

export function getInnerScene(title: string) {
  const scene = new NestedScene({
    title: title,
    canRemove: true,
    canCollapse: true,
    $variables: new SceneVariableSet({
      variables: [
        new TestVariable({
          name: 'pod',
          query: 'A.AA.*',
          value: 'server',
          text: '',
          delayMs: 1000,
          options: [],
        }),
        new TestVariable({
          name: 'subServer',
          query: 'A.$server',
          value: 'server',
          text: '',
          description:
            'This should change when you change the top level scene $server variable but that is not supported yet',
          delayMs: 1000,
          options: [],
        }),
      ],
    }),
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries().setTitle('Panel: server = $server, pod = $pod').build(),
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
    controls: [new VariableValueSelectors({}), new SceneTimePicker({})],
  });

  return scene;
}
