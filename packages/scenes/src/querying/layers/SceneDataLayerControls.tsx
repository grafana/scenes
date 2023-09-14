import { InlineSwitch } from '@grafana/ui';
import React from 'react';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneDataLayerProvider, SceneObjectState } from '../../core/types';
import { ControlsLabel } from '../../utils/ControlsLabel';

interface SceneDataLayerControlsState extends SceneObjectState {
  layersMap: Record<string, boolean>;
}

export class SceneDataLayerControls extends SceneObjectBase<SceneDataLayerControlsState> {
  public static Component = SceneDataLayerControlsRenderer;

  public constructor() {
    // Holds the state of the layers, to avoid force re-rendering
    super({ layersMap: {} });

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    const layers = sceneGraph.getDataLayers(this, true);
    this.setState({ layersMap: layers.reduce((acc, l) => ({ ...acc, [l.state.key!]: l.state.isEnabled }), {}) });
  }

  public toggleLayer(l: SceneDataLayerProvider) {
    this.setState({ layersMap: { ...this.state.layersMap, [l.state.key!]: !l.state.isEnabled } });
    l.setState({ isEnabled: !l.state.isEnabled });
  }
}

function SceneDataLayerControlsRenderer({ model }: SceneComponentProps<SceneDataLayerControls>) {
  const { layersMap } = model.useState();
  // Get only layers closest to the controls
  const layers = sceneGraph.getDataLayers(model, true);

  if (layers.length === 0) {
    return null;
  }

  return (
    <>
      {layers.map((l) => {
        const elementId = `data-layer-${l.state.key}`;
        return (
          <div
            key={elementId}
            style={{
              display: 'flex',
            }}
          >
            <ControlsLabel htmlFor={elementId} label={l.state.name} />
            <InlineSwitch id={elementId} value={layersMap[l.state.key!]} onChange={() => model.toggleLayer(l)} />
          </div>
        );
      })}
    </>
  );
}
