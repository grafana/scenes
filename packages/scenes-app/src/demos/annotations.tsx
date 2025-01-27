import {
  dataLayers,
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneDataLayerSet,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  VizPanel,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getAnnotationsDemo(defaults: SceneAppPageState) {
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
        scenarioId: 'annotations',
      },
    },
  });

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
        lines: 5,
        refId: 'Anno',
        scenarioId: 'annotations',
      },
    },
  });

  const independentAnnotations = new dataLayers.AnnotationsDataLayer({
    name: 'Independent annotations',
    query: {
      datasource: {
        type: 'testdata',
        uid: 'gdev-testdata',
      },
      enable: true,
      iconColor: 'purple',
      name: 'New annotation',
      target: {
        // @ts-ignore
        lines: 3,
        refId: 'Anno',
        scenarioId: 'annotations',
      },
    },
  });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        controls: [
          new SceneDataLayerControls(),
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneRefreshPicker({}),
        ],
        key: 'Multiple annotations layers',
        $data: new SceneDataLayerSet({
          layers: [globalAnnotations],
        }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  $data: getQueryRunnerWithRandomWalkQuery({ scenarioId: 'slow_query', stringInput: '5s' }),
                  body: new VizPanel({
                    title: 'Global annotations only',
                    pluginId: 'timeseries',
                  }),
                }),
                new SceneFlexItem({
                  $data: nestedAnnotationsDataLayer,
                  body: new VizPanel({
                    $data: getQueryRunnerWithRandomWalkQuery({}),
                    title: 'Nested annotations',
                    description: 'Uses a single data layer directly, not inside a SceneDataLayers',
                    pluginId: 'timeseries',
                    headerActions: [new SceneDataLayerControls()],
                  }),
                }),
                new SceneFlexItem({
                  body: new VizPanel({
                    $data: new SceneQueryRunner({
                      $data: new SceneDataLayerSet({
                        layers: [independentAnnotations],
                      }),
                      queries: [
                        {
                          refId: 'A',
                          datasource: DATASOURCE_REF,
                          scenarioId: 'random_walk',
                        },
                      ],
                    }),
                    title: 'Combined annotations, from global and SceneQueryRunner',
                    pluginId: 'timeseries',
                    headerActions: [new SceneDataLayerControls()],
                  }),
                }),
              ],
            }),
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  $data: new SceneDataTransformer({
                    $data: getQueryRunnerWithRandomWalkQuery({
                      scenarioId: 'csv_metric_values',
                      stringInput: '1,20,90,30,5,0',
                    }),
                    transformations: [
                      {
                        id: 'calculateField',
                        options: {
                          mode: 'binary',
                          reduce: {
                            reducer: 'sum',
                          },
                          binary: {
                            left: 'A-series',
                            reducer: 'sum',
                            operator: '*',
                            right: '2',
                          },
                        },
                      },
                    ],
                  }),
                  body: new VizPanel({
                    title: 'Transformed data & Global annotations',
                    pluginId: 'timeseries',
                  }),
                }),
                new SceneFlexItem({
                  $data: new SceneDataLayerSet({
                    layers: [
                      new dataLayers.AnnotationsDataLayer({
                        name: 'Local annotations',
                        query: {
                          datasource: {
                            type: 'testdata',
                            uid: 'gdev-testdata',
                          },
                          enable: true,
                          iconColor: 'green',
                          name: 'New annotation',
                          target: {
                            // @ts-ignore
                            lines: 4,
                            refId: 'Anno',
                            scenarioId: 'annotations',
                          },
                        },
                      }),
                    ],
                  }),
                  body: new VizPanel({
                    $data: new SceneDataTransformer({
                      $data: getQueryRunnerWithRandomWalkQuery({
                        scenarioId: 'csv_metric_values',
                        stringInput: '1,20,90,30,5,0',
                      }),
                      transformations: [
                        {
                          id: 'calculateField',
                          options: {
                            mode: 'binary',
                            reduce: {
                              reducer: 'sum',
                            },
                            binary: {
                              left: 'A-series',
                              reducer: 'sum',
                              operator: '*',
                              right: '5',
                            },
                          },
                        },
                      ],
                    }),
                    title: 'Transformed local data, global+local annotations',
                    pluginId: 'timeseries',
                    headerActions: [new SceneDataLayerControls()],
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
