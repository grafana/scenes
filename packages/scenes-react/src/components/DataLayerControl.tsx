import React from 'react';
import { SceneDataLayerProvider, SceneDataLayerSet, sceneGraph, ControlsLabel } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { LoadingState } from '@grafana/data';

export interface Props {
  name: string;
}

export function DataLayerControl({ name }: Props) {
  const scene = useSceneContext();
  const styles = useStyles2(getStyles);
  const layerSets = sceneGraph.getDataLayers(scene);

  const layer = getLayer(layerSets, name);
  const isLoading = Boolean(layer && layer.state.data?.state === LoadingState.Loading);

  if (!layer) {
    return <div>Annotation {name} not found</div>;
  }

  return (
    <div className={styles.container}>
      <ControlsLabel
        htmlFor={`data-layer-${layer.state.key}`}
        isLoading={isLoading}
        onCancel={() => layer.cancelQuery?.()}
        label={layer.state.name}
        description={layer.state.description}
        error={layer.state.data?.errors?.[0].message}
      />
      <layer.Component model={layer} />
    </div>
  );
}

const getStyles = () => ({
  container: css({
    display: 'flex',
  }),
});

function getLayer(layers: SceneDataLayerProvider[], name: string): SceneDataLayerProvider | undefined {
  for (let i = 0; i < layers.length; i++) {
    const layer = (layers[i] as SceneDataLayerSet).state.layers.find((layer) => layer.state.name === name);

    if (layer) {
      return layer;
    }
  }

  return undefined;
}
