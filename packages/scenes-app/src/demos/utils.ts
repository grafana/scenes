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
