import {
  QueryRunnerState,
  SceneCanvasText,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  VariableValueSelectors,
  SceneDataQuery,
} from '@grafana/scenes';
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
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      new SceneTimePicker({}),
      new SceneRefreshPicker({}),
    ],
  };
}

export function getRowWithText(text: string) {
  return new SceneFlexItem({
    ySizing: 'content',
    body: new SceneCanvasText({
      text,
      fontSize: 12,
    }),
  });
}

export function getPromQueryInstant(query: Partial<SceneDataQuery>): SceneQueryRunner {
  return new SceneQueryRunner({
    datasource: { uid: 'gdev-prometheus' },
    queries: [
      {
        refId: 'A',
        instant: true,
        format: 'table',
        maxDataPoints: 500,
        ...query,
      },
    ],
  });
}

export function getPromQueryTimeSeries(query: Partial<SceneDataQuery>): SceneQueryRunner {
  return new SceneQueryRunner({
    datasource: { uid: 'gdev-prometheus' },
    queries: [
      {
        refId: 'A',
        range: true,
        format: 'time_series',
        maxDataPoints: 500,
        ...query,
      },
    ],
  });
}
