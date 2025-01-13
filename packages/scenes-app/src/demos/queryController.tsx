import {
  SceneFlexLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneFlexItem,
  NestedScene,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneTimePicker,
  SceneRefreshPicker,
  SceneCSSGridLayout,
  SceneControlsSpacer,
  dataLayers,
  SceneDataLayerControls,
  SceneDataLayerSet,
  SceneVariableSet,
  TestVariable,
  VariableValueSelectors,
  behaviors,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { VariableRefresh } from '@grafana/schema';

export function getQueryControllerDemo(defaults: SceneAppPageState) {
  const globalAnnotations = new dataLayers.AnnotationsDataLayer({
    name: 'Global annotations',
    query: {
      datasource: {
        type: 'testdata',
        uid: 'gdev-testdata',
      },
      enable: true,
      iconColor: 'yellow',
      name: 'New annotation',
      target: {
        // @ts-ignore
        lines: 10,
        refId: 'Anno',
        scenarioId: 'slow_query',
        stringInput: '10s',
      },
    },
  });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: new SceneDataLayerSet({
          layers: [globalAnnotations],
        }),
        $behaviors: [new behaviors.SceneQueryController()],
        $variables: new SceneVariableSet({
          variables: [
            new TestVariable({
              name: 'server',
              query: 'A.*',
              value: 'server',
              delayMs: 1000,
              options: [],
              refresh: VariableRefresh.onTimeRangeChanged,
            }),
            new TestVariable({
              name: 'pod',
              query: 'A.$server.*',
              value: 'pod',
              delayMs: 3000,
              options: [],
              refresh: VariableRefresh.onDashboardLoad,
            }),
          ],
        }),
        controls: [
          new VariableValueSelectors({}),
          new SceneDataLayerControls(),
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneRefreshPicker({ withText: true, primary: true }),
        ],
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              height: '320px',
              body: new SceneCSSGridLayout({
                autoRows: '320px',
                children: [
                  PanelBuilders.timeseries()
                    .setTitle('2s query')
                    .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '2s' }))
                    .build(),
                  PanelBuilders.timeseries()
                    .setTitle('3s query')
                    .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '3s' }))
                    .build(),
                  PanelBuilders.timeseries()
                    .setTitle('5s query')
                    .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' }))
                    .build(),
                ],
              }),
            }),
            new SceneFlexItem({
              body: getInnerScene('Inner scene1'),
            }),
          ],
        }),
      });
    },
  });
}

export function getInnerScene(title: string) {
  const nestedAnnotationsDataLayer = new dataLayers.AnnotationsDataLayer({
    name: 'Nested annotations',
    query: {
      datasource: {
        type: 'testdata',
        uid: 'gdev-testdata',
      },
      enable: true,
      iconColor: 'red',
      name: 'New annotation',
      target: {
        // @ts-ignore
        lines: 10,
        refId: 'Anno',
        scenarioId: 'slow_query',
        stringInput: '10s',
      },
    },
  });

  const scene = new NestedScene({
    title: title,
    canCollapse: true,
    body: new SceneCSSGridLayout({
      children: [
        PanelBuilders.timeseries()
          .setTitle('2s query')
          .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '2s' }))
          .build(),
        PanelBuilders.timeseries()
          .setTitle('3s query')
          .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '3s' }))
          .build(),
        PanelBuilders.timeseries()
          .setTitle('5s query')
          .setData(getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' }))
          .build(),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: new SceneDataLayerSet({
      layers: [nestedAnnotationsDataLayer],
    }),
    $behaviors: [new behaviors.SceneQueryController()],
    controls: [
      new SceneDataLayerControls(),
      new SceneControlsSpacer(),
      new SceneTimePicker({}),
      new SceneRefreshPicker({ withText: true }),
    ],
  });

  return scene;
}
