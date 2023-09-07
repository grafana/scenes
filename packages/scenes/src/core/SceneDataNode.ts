import { DataTopic, getDefaultTimeRange, PanelData } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { of } from 'rxjs';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneDataProvider, SceneDataProviderResult, SceneDataState } from './types';

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

  public getDataTopic() {
    return 'data' as DataTopic;
  }

  public getResultsStream() {
    const result: SceneDataProviderResult = {
      origin: this,
      data: this.state.data,
    };

    return of(result);
  }
}

export const emptyPanelData: PanelData = {
  state: LoadingState.Done,
  series: [],
  timeRange: getDefaultTimeRange(),
};
