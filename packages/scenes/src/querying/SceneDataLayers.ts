import { PanelData } from '@grafana/data';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { CancelActivationHandler, SceneDataLayerProvider, SceneDataProvider, SceneObjectState } from '../core/types';

interface SceneDataLayersState extends SceneObjectState {
  layers: SceneDataLayerProvider[];
  data?: PanelData;
}

export class SceneDataLayers extends SceneObjectBase<SceneDataLayersState> implements SceneDataProvider {
  public constructor(state: SceneDataLayersState) {
    super(state);

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    const { layers } = this.state;
    const deactivationHandlers: CancelActivationHandler[] = [];
    for (const layer of layers) {
      deactivationHandlers.push(layer.activate());
    }

    return () => {
      deactivationHandlers.forEach((handler) => handler());
    };
  }
}
