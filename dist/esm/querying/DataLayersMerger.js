import { merge, mergeAll, filter, map, finalize } from 'rxjs';

class DataLayersMerger {
  constructor() {
    this._resultsMap = /* @__PURE__ */ new Map();
    this._prevLayers = [];
  }
  getMergedStream(layers) {
    if (areDifferentLayers(layers, this._prevLayers)) {
      this._resultsMap = /* @__PURE__ */ new Map();
      this._prevLayers = layers;
    }
    const resultStreams = layers.map((l) => l.getResultsStream());
    const deactivationHandlers = [];
    for (const layer of layers) {
      deactivationHandlers.push(layer.activate());
    }
    return merge(resultStreams).pipe(
      mergeAll(),
      filter((v) => {
        return this._resultsMap.get(v.origin.state.key) !== v;
      }),
      map((v) => {
        this._resultsMap.set(v.origin.state.key, v);
        return this._resultsMap.values();
      }),
      finalize(() => {
        deactivationHandlers.forEach((handler) => handler());
      })
    );
  }
}
function areDifferentLayers(a, b) {
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

export { DataLayersMerger };
//# sourceMappingURL=DataLayersMerger.js.map
