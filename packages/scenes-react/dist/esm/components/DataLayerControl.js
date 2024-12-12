import React from 'react';
import { sceneGraph } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks.js';

function DataLayerControl({ name }) {
  const scene = useSceneContext();
  const layerSets = sceneGraph.getDataLayers(scene);
  const layer = getLayer(layerSets, name);
  if (!layer) {
    return /* @__PURE__ */ React.createElement("div", null, "Annotation ", name, " not found");
  }
  return /* @__PURE__ */ React.createElement(layer.Component, {
    model: layer
  });
}
function getLayer(layers, name) {
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i].state.layers.find((layer2) => layer2.state.name === name);
    if (layer) {
      return layer;
    }
  }
  return void 0;
}

export { DataLayerControl };
//# sourceMappingURL=DataLayerControl.js.map
