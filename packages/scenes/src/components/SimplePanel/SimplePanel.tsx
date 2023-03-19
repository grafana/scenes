import { PanelChrome } from '@grafana/ui';
import React, { RefCallback } from 'react';
import { useMeasure } from 'react-use';
import { sceneGraph } from '../../core/sceneGraph';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { isSceneObject, SceneComponentProps, SceneLayoutChildState, SceneObject } from '../../core/types';

export interface SimplePanelState extends SceneLayoutChildState {
  title: string;
  description?: string;
  displayMode?: 'default' | 'transparent';
  hoverHeader?: boolean;
  body?: SceneObject | React.ComponentType<{}>;
}

/**
 * Simple wrapper for panel chrome (frames) that don't subscribe to data (so no loading state / animation).
 */
export class SimplePanel extends SceneObjectBase<SimplePanelState> {
  static Component = SimplePanelRenderer;
}

function SimplePanelRenderer({ model }: SceneComponentProps<SimplePanel>) {
  const { title, description, displayMode, hoverHeader, body } = model.useState();
  const [ref, { width, height }] = useMeasure();

  // Interpolate title
  const titleInterpolated = sceneGraph.interpolate(model, title, undefined, 'text');

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <PanelChrome
        title={titleInterpolated}
        description={description ? () => sceneGraph.interpolate(model, description, undefined, 'text') : ''}
        width={width}
        height={height}
        displayMode={displayMode}
        hoverHeader={hoverHeader}
      >
        {(innerWidth, innerHeight) => <>{isSceneObject(body) ? <body.Component model={body} /> : <body />}</>}
      </PanelChrome>
    </div>
  );
}
