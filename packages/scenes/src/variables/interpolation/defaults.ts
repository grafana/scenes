import { getDefaultTimeRange, LoadingState } from '@grafana/data';
import { SceneDataNode } from '../../core/SceneDataNode';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneVariableSet } from '../sets/SceneVariableSet';

export const EmptyVariableSet = new SceneVariableSet({ variables: [] });

export const EmptyDataNode = new SceneDataNode({
  data: {
    state: LoadingState.Done,
    series: [],
    timeRange: getDefaultTimeRange(),
  },
});

export const DefaultTimeRange = new SceneTimeRange();
