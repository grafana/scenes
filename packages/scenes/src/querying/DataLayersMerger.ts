import { filter, finalize, map, merge, mergeAll } from 'rxjs';
import { CancelActivationHandler, SceneDataLayerProvider, SceneDataProviderResult } from '../core/types';

export class DataLayersMerger {
  private _resultsMap: Map<string, SceneDataProviderResult> = new Map();
  private _prevLayers: SceneDataLayerProvider[] = [];

  public getMergedStream(layers: SceneDataLayerProvider[]) {
    if (areDifferentLayers(layers, this._prevLayers)) {
      this._resultsMap = new Map();
      this._prevLayers = layers;
    }

    const resultStreams = layers.map((l) => l.getResultsStream());
    const deactivationHandlers: CancelActivationHandler[] = [];

    for (const layer of layers) {
      deactivationHandlers.push(layer.activate());
    }

    return merge(resultStreams).pipe(
      mergeAll(),
      filter((v) => {
        return this._resultsMap.get(v.origin.state.key!) !== v;
      }),
      map((v) => {
        // Is there a better, rxjs only way to combine multiple same-data-topic observables?
        // Indexing by origin state key is to make sure we do not duplicate/overwrite data from the different origins
        this._resultsMap.set(v.origin.state.key!, v);
        return this._resultsMap.values();
      }),
      finalize(() => {
        deactivationHandlers.forEach((handler) => handler());
      })
    );
  }
}

function areDifferentLayers(a: SceneDataLayerProvider[], b: SceneDataLayerProvider[]) {
  if (a.length !== b.length) {
    return true;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return true;
    }
  }

  return false;
}
