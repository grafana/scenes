import { css } from '@emotion/css';
import { LoadingState } from '@grafana/schema';
import { InlineSwitch, useTheme2 } from '@grafana/ui';
import React, { useEffect } from 'react';
import { map, of, switchMap, timer } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneDataLayerProvider, SceneObjectState } from '../../core/types';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { LoadingIndicator } from '../../utils/LoadingIndicator';

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
          <SceneDataLayerControl
            key={elementId}
            layer={l}
            onToggleLayer={() => model.toggleLayer(l)}
            isEnabled={layersMap[l.state.key!]}
          />
        );
      })}
    </>
  );
}

interface SceneDataLayerControlProps {
  isEnabled: boolean;
  layer: SceneDataLayerProvider;
  onToggleLayer: () => void;
}

export function SceneDataLayerControl({ layer, isEnabled, onToggleLayer }: SceneDataLayerControlProps) {
  const theme = useTheme2();
  const elementId = `data-layer-${layer.state.key}`;
  const [showLoading, setShowLoading] = React.useState(false);

  useEffect(() => {
    const stateStream = layer.getResultsStream().pipe(map((r) => r.data.state));

    const loadingIndicatorSub = stateStream
      .pipe(
        switchMap((event) => {
          if (event === LoadingState.Loading) {
            return timer(500).pipe(map(() => true));
          }
          return of(false);
        })
      )
      .subscribe((v) => {
        setShowLoading(v);
      });

    return () => {
      loadingIndicatorSub.unsubscribe();
    };
  }, [layer]);

  return (
    <div className={containerStyle}>
      <ControlsLabel
        htmlFor={elementId}
        label={
          <>
            {layer.state.name}
            {showLoading && (
              <div style={{ marginLeft: theme.spacing(1), marginTop: '-1px' }}>
                <LoadingIndicator
                  onCancel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    layer.cancelQuery?.();
                  }}
                />
              </div>
            )}
          </>
        }
      />
      <InlineSwitch id={elementId} value={isEnabled} onChange={onToggleLayer} />
    </div>
  );
}

const containerStyle = css({ display: 'flex' });
