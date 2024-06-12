import React from 'react';
import { useDataLayers } from '../hooks/hooks';
import { DataLayerControlSwitch } from '@grafana/scenes/src/querying/layers/SceneDataLayerControls';

export interface Props {}

export function AnnotationPicker(props: Props) {
  const layers = useDataLayers();

  return (
    <>
      {layers.map((layer, key) => {
        return <DataLayerControlSwitch layer={layer} key={`data-layer-control-switch-${key}`} />;
      })}
    </>
  );
}
