import { PanelData } from '@grafana/data';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneDataProvider, SceneObjectState } from './types';

export interface SceneDataNodeState extends SceneObjectState {
  data?: PanelData;
}

export class SceneDataNode extends SceneObjectBase<SceneDataNodeState> implements SceneDataProvider {}
