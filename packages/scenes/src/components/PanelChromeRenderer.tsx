import React, { RefCallback } from 'react';
import { useMeasure } from 'react-use';

import { LoadingState } from '@grafana/data';
import { PanelChrome } from '@grafana/ui';

import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneLayoutChildState, SceneObject } from '../core/types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneDragHandle } from './SceneDragHandle';

export interface PanelChromeState extends SceneLayoutChildState {
  title: string;
  description?: string;
  displayMode?: 'default' | 'transparent';
  hoverHeader?: boolean;
}

interface PanelChromeRendererProps {
  children: React.ReactNode | ((innerWidth: number, innerHeight: number) => React.ReactNode);
  loadingState?: LoadingState;
  statusMessage?: string;
}

export function PanelChromeRenderer({
  model,
  children,
  loadingState,
  statusMessage,
}: SceneComponentProps<SceneObject<PanelChromeState>> & PanelChromeRendererProps) {
  const { title, description, $data, placement, displayMode, hoverHeader } = model.useState();
  const [ref, { width, height }] = useMeasure();

  const parentLayout = sceneGraph.getLayout(model);

  // TODO: this should probably be parentLayout.isDraggingEnabled() ? placement?.isDraggable : false
  // The current logic is not correct, just because parent layout itself is not draggable does not mean children are not
  const isDraggable = parentLayout.state.placement?.isDraggable ? placement?.isDraggable : false;
  const dragHandle = <SceneDragHandle layoutKey={parentLayout.state.key!} />;

  const titleInterpolated = sceneGraph.interpolate(model, title, undefined, 'text');

  // Query runner needs to with for auto maxDataPoints
  if ($data instanceof SceneQueryRunner) {
    $data.setContainerWidth(width);
  }

  const titleItems: React.ReactNode[] = isDraggable ? [dragHandle] : [];

  // If we have local time range show that in panel header
  if (model.state.$timeRange) {
    titleItems.push(<model.state.$timeRange.Component model={model.state.$timeRange} />);
  }

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <PanelChrome
        title={titleInterpolated}
        description={description ? () => sceneGraph.interpolate(model, description) : ''}
        loadingState={loadingState}
        statusMessage={statusMessage}
        width={width}
        height={height}
        displayMode={displayMode}
        hoverHeader={hoverHeader}
        titleItems={isDraggable ? [dragHandle] : []}
      >
        {(innerWidth, innerHeight) => (typeof children === 'function' ? children?.(innerWidth, innerHeight) : children)}
      </PanelChrome>
    </div>
  );
}
