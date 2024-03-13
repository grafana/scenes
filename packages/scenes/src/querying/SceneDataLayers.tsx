import React from 'react';
import { DataFrame } from '@grafana/data';
import { finalize, map, merge, mergeAll, Observable, ReplaySubject, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../core/SceneDataNode';
import { SceneObjectBase } from '../core/SceneObjectBase';
import {
  CancelActivationHandler,
  SceneComponentProps,
  SceneDataLayerProvider,
  SceneDataLayerProviderState,
  SceneDataProviderResult,
} from '../core/types';

interface SceneDataLayersState extends SceneDataLayerProviderState {
  layers: SceneDataLayerProvider[];
}

export class SceneDataLayers extends SceneObjectBase<SceneDataLayersState> implements SceneDataLayerProvider {
  /** Mark it as a data layer */
  public isDataLayer: true = true;

  /**
   * Subscription to query results. Should be set when layer runs a query.
   */
  protected querySub?: Unsubscribable;

  /**
   * Subject to emit results to.
   */
  private _results = new ReplaySubject<SceneDataProviderResult>();

  public constructor(state: Partial<SceneDataLayersState>) {
    super({
      name: state.name ?? 'Data layers',
      layers: state.layers ?? [],
    });

    this.addActivationHandler(() => this._onActivate());
  }

  setContainerWidth?: ((width: number) => void) | undefined;
  isDataReadyToDisplay?: (() => boolean) | undefined;

  private _onActivate() {
    this._subs.add(
      this.subscribeToState((newState, oldState) => {
        if (newState.layers !== oldState.layers) {
          this.querySub?.unsubscribe();
          this.subscribeToAllLayers();
        }
      })
    );

    this.subscribeToAllLayers();
  }

  private subscribeToAllLayers() {
    const { layers } = this.state;

    if (layers.length > 0) {
      this.querySub = mergeMultipleDataLayers(layers).subscribe(this._onLayerUpdateReceived.bind(this));
    } else {
      this._results.next({ origin: this, data: emptyPanelData });
      this.setState({ data: emptyPanelData });
    }
  }

  private _onLayerUpdateReceived(results: Iterable<SceneDataProviderResult>) {
    let series: DataFrame[] = [];

    for (const result of results) {
      if (result.data?.series) {
        series = series.concat(result.data.series);
      }
    }

    const combinedData = { ...emptyPanelData, series: series };

    this._results.next({ origin: this, data: combinedData });
    this.setState({ data: combinedData });
  }

  public getResultsStream(): Observable<SceneDataProviderResult> {
    return this._results;
  }

  public cancelQuery() {
    this.querySub?.unsubscribe();
  }

  public static Component = ({ model }: SceneComponentProps<SceneDataLayers>) => {
    const { layers } = model.useState();

    return (
      <>
        {layers.map((layer) => (
          <layer.Component model={layer} key={layer.state.key} />
        ))}
      </>
    );
  };
}

export function mergeMultipleDataLayers(
  layers: SceneDataLayerProvider[]
): Observable<Iterable<SceneDataProviderResult>> {
  const resultStreams = layers.map((l) => l.getResultsStream());
  const resultsMap: Map<string, SceneDataProviderResult> = new Map();

  const deactivationHandlers: CancelActivationHandler[] = [];

  for (const layer of layers) {
    deactivationHandlers.push(layer.activate());
  }

  return merge(resultStreams).pipe(
    mergeAll(),
    map(
      (v) => {
        // Is there a better, rxjs only way to combine multiple same-data-topic observables?
        // Indexing by origin state key is to make sure we do not duplicate/overwrite data from the different origins
        resultsMap.set(v.origin.state.key!, v);
        return resultsMap.values();
      },
      finalize(() => {
        deactivationHandlers.forEach((handler) => handler());
      })
    )
  );
}
