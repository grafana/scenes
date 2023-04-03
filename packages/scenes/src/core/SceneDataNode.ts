import { getDefaultTimeRange, PanelData } from '@grafana/data';
import { LoadingState } from '@grafana/schema';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneDataProvider, SceneDataState } from './types';

export interface SceneDataNodeState extends SceneDataState {
  data: PanelData;
}

export class SceneDataNode extends SceneObjectBase<SceneDataNodeState> implements SceneDataProvider {
  public constructor(state?: Partial<SceneDataNodeState>) {
    super({
      data: emptyPanelData,
      ...state,
    });
  }
}

export const emptyPanelData = {
  state: LoadingState.Done,
  series: [],
  timeRange: getDefaultTimeRange(),
};
