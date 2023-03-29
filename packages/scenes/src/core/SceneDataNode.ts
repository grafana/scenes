import { getDefaultTimeRange, PanelData } from '@grafana/data';
import { LoadingState } from '@grafana/schema';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneDataProvider, SceneObjectStatePlain } from './types';

export interface SceneDataNodeState extends SceneObjectStatePlain {
  data: PanelData;
}

export class SceneDataNode extends SceneObjectBase<SceneDataNodeState> implements SceneDataProvider {
  public constructor(state?: Partial<SceneDataNodeState>) {
    super({
      data: getEmptyPanelData(),
      ...state,
    });
  }
}

export function getEmptyPanelData() {
  return {
    state: LoadingState.Done,
    series: [],
    timeRange: getDefaultTimeRange(),
  };
}
