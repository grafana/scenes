import { SceneDataLayerProvider, SceneDataState, SceneObjectRef } from "@grafana/scenes";
import { DataProxyProvider, DataProxyProviderState } from "./DataProxyProvider";

export interface DataLayerProxyProviderState extends SceneDataState {
  source: SceneObjectRef<SceneDataLayerProvider>;
}

// :/
export class DataLayerProxyProvider extends DataProxyProvider implements SceneDataLayerProvider {
  private isDataLayer = true;

  public constructor(state: DataProxyProviderState) {
    super({
      source: state.source,
      data: state.source.resolve().state.data,
    });
  }
}
