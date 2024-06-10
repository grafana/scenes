import { SceneDataLayerProvider, SceneDataProviderResult, SceneDataState, SceneObjectBase, SceneObjectRef } from "@grafana/scenes";
import { Observable } from "rxjs";

export interface DataLayerProxyProviderState extends SceneDataState {
  source: SceneObjectRef<SceneDataLayerProvider>;
  name: string;
}

export class DataLayerProxyProvider extends SceneObjectBase<DataLayerProxyProviderState> implements SceneDataLayerProvider {
  public isDataLayer: true = true;

  public constructor(state: DataLayerProxyProviderState) {
    super({
      name: state.name,
      source: state.source,
      data: state.source.resolve().state.data,
    });
  }

  public setContainerWidth(width: number) {
    this.state.source.resolve().setContainerWidth?.(width);
  }

  public isDataReadyToDisplay() {
    return this.state.source.resolve().isDataReadyToDisplay?.() ?? true;
  }

  public cancelQuery() {
    this.state.source.resolve().cancelQuery?.();
  }

  public getResultsStream(): Observable<SceneDataProviderResult> {
    return this.state.source.resolve().getResultsStream();
  }
}
