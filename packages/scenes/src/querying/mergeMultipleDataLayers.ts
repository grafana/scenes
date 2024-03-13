import { finalize, map, merge, mergeAll, Observable } from 'rxjs';
import { CancelActivationHandler, SceneDataLayerProvider, SceneDataProviderResult } from '../core/types';

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
    map((v) => {
      // Is there a better, rxjs only way to combine multiple same-data-topic observables?
      // Indexing by origin state key is to make sure we do not duplicate/overwrite data from the different origins
      resultsMap.set(v.origin.state.key!, v);
      return resultsMap.values();
    }),
    finalize(() => {
      deactivationHandlers.forEach((handler) => handler());
    })
  );
}
