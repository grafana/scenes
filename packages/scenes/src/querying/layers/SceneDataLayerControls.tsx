import React from 'react';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneDataLayerProvider, SceneObjectState } from '../../core/types';
import { LoadingState } from '@grafana/schema';
import { css } from '@emotion/css';
import { ControlsLabel } from '../../utils/ControlsLabel';

interface SceneDataLayerControlsState extends SceneObjectState {}

export class SceneDataLayerControls extends SceneObjectBase<SceneDataLayerControlsState> {
  public static Component = SceneDataLayerControlsRenderer;

  public constructor() {
    super({});
  }
}

function SceneDataLayerControlsRenderer({ model }: SceneComponentProps<SceneDataLayerControls>) {
  const layers = sceneGraph.getDataLayers(model, true);

  if (layers.length === 0) {
    return null;
  }

  return (
    <>
      {layers.map((layer) => (
        <SceneDataLayerControlRenderer layer={layer} key={layer.state.key} />
      ))}
    </>
  );
}

// Renders controls for a single data layer
export function SceneDataLayerControlRenderer({ layer }: { layer: SceneDataLayerProvider }) {
  const elementId = `data-layer-${layer.state.key}`;
  const { data, isHidden } = layer.useState();
  const showLoading = Boolean(data && data.state === LoadingState.Loading);

  if (isHidden) {
    return null;
  }

  return (
    <div className={containerStyle}>
      <ControlsLabel
        htmlFor={elementId}
        isLoading={showLoading}
        onCancel={() => layer.cancelQuery?.()}
        label={layer.state.name}
        description={layer.state.description}
        error={layer.state.data?.errors?.[0].message}
      />
      <layer.Component model={layer} />
    </div>
  );
}

const containerStyle = css({ display: 'flex' });
