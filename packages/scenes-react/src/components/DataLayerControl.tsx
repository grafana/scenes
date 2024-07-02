import React from 'react';
import { SceneDataLayerProvider, SceneDataLayerSet, sceneGraph } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';

export interface Props {
  name: string;
}

export function DataLayerControl({ name }: Props) {
  const scene = useSceneContext();
  const layerSets = sceneGraph.getDataLayers(scene);

  const layer = getLayer(layerSets, name);

  if (!layer) {
    return <div>Annotation {name} not found</div>;
  }

  return <layer.Component model={layer} />;
}

function getLayer(layers: SceneDataLayerProvider[], name: string): SceneDataLayerProvider | undefined {
  for (let i = 0; i < layers.length; i++) {
    const layer = (layers[i] as SceneDataLayerSet).state.layers.find((layer) => layer.state.name === name);

    if (layer) {
      return layer;
    }
  }

  return undefined;
}
