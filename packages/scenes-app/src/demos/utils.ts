import {
  QueryRunnerState,
  SceneControlsSpacer,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { GraphFieldConfig } from '@grafana/schema';
import { DATASOURCE_REF } from '../constants';

export function getQueryRunnerWithRandomWalkQuery(
  overrides?: Partial<any>,
  queryRunnerOverrides?: Partial<QueryRunnerState>
) {
  return new SceneQueryRunner({
    queries: [
      {
        refId: 'A',
        datasource: DATASOURCE_REF,
        scenarioId: 'random_walk',
        ...overrides,
      },
    ],
    ...queryRunnerOverrides,
  });
}

export function getEmbeddedSceneDefaults() {
  return {
    $timeRange: new SceneTimeRange(),
    controls: [
      new SceneControlsSpacer(),
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({ isOnCanvas: true }),
    ],
  };
}

export function newTimeSeriesPanel(
  overrides: Partial<VizPanelState> = {},
  customStyles: Partial<GraphFieldConfig> = {}
) {
  return new VizPanel({
    pluginId: 'timeseries',
    title: 'Graph',
    options: {},
    fieldConfig: {
      defaults: {
        custom: {
          ...customStyles,
        },
      },
      overrides: [],
    },
    ...overrides,
  });
}
