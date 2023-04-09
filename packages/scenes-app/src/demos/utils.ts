import {
  QueryRunnerState,
  SceneControlsSpacer,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
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
      new SceneControlsSpacer(),
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({ isOnCanvas: true }),
    ],
  };
}
