import { DataFrame, DataTopic, PanelData } from '@grafana/data';
import { map, merge, mergeAll, Observable, ReplaySubject } from 'rxjs';
import { emptyPanelData } from '../core/SceneDataNode';
import { SceneObjectBase } from '../core/SceneObjectBase';
import {
  CancelActivationHandler,
  SceneDataLayerProvider,
  SceneDataLayerProviderResult,
  SceneDataProvider,
  SceneDataProviderResult,
  SceneObjectState,
} from '../core/types';

interface SceneDataLayersState extends SceneObjectState {
  layers: SceneDataLayerProvider[];
  data?: PanelData;
}

export class SceneDataLayers extends SceneObjectBase<SceneDataLayersState> implements SceneDataProvider {
  private _results = new ReplaySubject<SceneDataProviderResult>();

  public constructor(state: SceneDataLayersState) {
    super(state);

    this.addActivationHandler(() => this._onActivate());
  }

  public getResultsStream() {
    return this._results;
  }

  public cancelQuery() {
    const { layers } = this.state;
    for (const layer of layers) {
      layer.cancelQuery?.();
    }
  }

  private _onActivate() {
    const { layers } = this.state;
    const deactivationHandlers: CancelActivationHandler[] = [];
    for (const layer of layers) {
      deactivationHandlers.push(layer.activate());
    }

    this._activateLayers();

    return () => {
      deactivationHandlers.forEach((handler) => handler());
    };
  }

  private _activateLayers() {
    const { layers } = this.state;
    const observables: Array<Observable<SceneDataLayerProviderResult>> = [];

    const resultsMap: Record<DataTopic, Map<string, DataFrame[]>> = {
      annotations: new Map(),
    };

    if (layers.length > 0) {
      layers.forEach((layer) => {
        observables.push(layer.getResultsStream());
      });

      // possibly we want to combine the results from all layers and only then update, but this is tricky ;(
      this._subs.add(
        merge(observables)
          .pipe(
            mergeAll(),
            map((v) => {
              if (v.origin.getDataTopic() === DataTopic.Annotations) {
                // Is there a better, rxjs only way to combine multiple same-data-topic observables?
                // Indexing by origin state key is to make sure we do not duplicate/overwrite data from the different origins
                resultsMap[v.origin.getDataTopic()].set(v.origin.state.key!, v.data);
              }

              return resultsMap;
            })
          )
          .subscribe((result) => {
            this._onLayersReceived(result);
          })
      );
    }
  }

  private _onLayersReceived(results: Record<DataTopic, Map<string, DataFrame[]>>) {
    let annotations: DataFrame[] = [];
    if (results[DataTopic.Annotations]) {
      annotations = annotations.concat(this._combineAnnotations(results[DataTopic.Annotations]));
    }

    this.setState({
      data: {
        ...this.state.data!,
        annotations,
      },
    });

    this._results.next({ origin: this, data: this.state.data || emptyPanelData });
  }

  private _combineAnnotations(resultsMap: Map<string, DataFrame[]>) {
    return Array.from(resultsMap.values()).reduce<DataFrame[]>((acc, value) => {
      acc = acc.concat(value);
      return acc;
    }, []);
  }
}
