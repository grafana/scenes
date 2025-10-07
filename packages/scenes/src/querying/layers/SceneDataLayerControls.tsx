import { css } from '@emotion/css';
import { LoadingState } from '@grafana/schema';
import { InlineSwitch } from '@grafana/ui';
import React from 'react';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneDataLayerProvider, SceneObjectState } from '../../core/types';
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
        <layer.Component model={layer} key={layer.state.key} />
      ))}
    </>
  );
}

interface SceneDataLayerControlProps {
  layer: SceneDataLayerProvider;
}

export function DataLayerControlSwitch({ layer }: SceneDataLayerControlProps) {
  const elementId = `data-layer-${layer.state.key}`;
  const { data, isEnabled } = layer.useState();
  const showLoading = Boolean(data && data.state === LoadingState.Loading);

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
      <InlineSwitch
        className={switchStyle}
        id={elementId}
        value={isEnabled}
        onChange={() => layer.setState({ isEnabled: !isEnabled })}
      />
    </div>
  );
}

const containerStyle = css({ display: 'flex' });

const switchStyle = css({
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
});
