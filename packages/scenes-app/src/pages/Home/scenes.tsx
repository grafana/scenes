import {
  CustomVariable,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
  VizPanel,
} from '@grafana/scenes';
import { ThresholdsMode } from '@grafana/schema';
import { DATASOURCE_REF } from '../../constants';
import { CustomSceneObject } from './CustomSceneObject';

export function getBasicScene(templatised = true, seriesToShow = '__server_names') {
  const timeRange = new SceneTimeRange({
    from: 'now-6h',
    to: 'now',
  });

  // Variable definition
  const customVariable = new CustomVariable({
    name: 'seriesToShow',
    label: 'Series to show',
    value: '__server_names',
    query: 'Server Names : __server_names, House locations : __house_locations',
  });

  // Query runner definition
  const queryRunner = new SceneQueryRunner({
    datasource: DATASOURCE_REF,
    queries: [
      {
        refId: 'A',
        datasource: DATASOURCE_REF,
        scenarioId: 'random_walk',
        seriesCount: 5,
        // Query is using variable value
        alias: templatised ? '${seriesToShow}' : seriesToShow,
        min: 30,
        max: 60,
      },
    ],
    maxDataPoints: 100,
  });

  // Custom object definition
  const customObject = new CustomSceneObject({
    value: '5',
    onChange: (newValue) => {
      queryRunner.setState({
        queries: [
          {
            ...queryRunner.state.queries[0],
            seriesCount: newValue,
          },
        ],
      });
      queryRunner.runQueries();
    },
  });

  return new EmbeddedScene({
    $timeRange: timeRange,
    $variables: new SceneVariableSet({ variables: templatised ? [customVariable] : [] }),
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: new VizPanel({
            pluginId: 'geomap',
            options: {
              view: {
                allLayers: true,
                id: 'coords',
                lat: 38.297683,
                lon: -99.228359,
                zoom: 3.98,
                shared: true,
              },
              controls: {
                showZoom: true,
                mouseWheelZoom: true,
                showAttribution: true,
                showScale: false,
                showMeasure: false,
                showDebug: false,
              },
              tooltip: {
                mode: 'details',
              },
              basemap: {
                config: {},
                name: 'Layer 0',
                type: 'default',
              },
              layers: [
                {
                  config: {
                    color: {
                      field: 'Price',
                      fixed: 'dark-green',
                    },
                    fillOpacity: 0.4,
                    shape: 'circle',
                    showLegend: true,
                    size: {
                      field: 'Count',
                      fixed: 5,
                      max: 15,
                      min: 2,
                    },
                  },
                  location: {
                    gazetteer: 'public/gazetteer/usa-states.json',
                    lookup: 'State',
                    mode: 'auto',
                  },
                  name: 'Layer 1',
                  type: 'markers',
                },
              ],
            },
            fieldConfig: {
              defaults: {
                custom: {
                  hideFrom: {
                    tooltip: false,
                    viz: false,
                    legend: false,
                  },
                },
                mappings: [],
                thresholds: {
                  mode: ThresholdsMode.Absolute,
                  steps: [
                    {
                      color: 'green',
                      value: 0,
                    },
                    {
                      color: 'red',
                      value: 80,
                    },
                  ],
                },
                color: {
                  mode: 'continuous-GrYlRd',
                },
              },
              overrides: [],
            },
            // Title is using variable value
            title: templatised ? '${seriesToShow}' : seriesToShow,
          }),
        }),
      ],
    }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      customObject,
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({
        intervals: ['5s', '1m', '1h'],
        isOnCanvas: true,
      }),
    ],
  });
}
