import React, { RefCallback } from 'react';

import { ScopedVars, InterpolateFunction } from '@grafana/data';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps, SceneLayoutChildState } from '../../core/types';

import { VizPanelRenderer } from './VizPanelRenderer';
import { VariableDependencyConfig } from '../../variables/VariableDependencyConfig';
import { VariableCustomFormatterFn } from '../../variables/types';
import { SceneVisualization } from './SceneVisualization';
import { useMeasure } from 'react-use';
import { VizPanelMenu } from './VizPanelMenu';
import { PanelChrome } from '@grafana/ui';

export interface ScenePanelState extends SceneLayoutChildState {
  title: string;
  description?: string;
  menu?: VizPanelMenu;
  body: SceneVisualization;
  displayMode?: 'default' | 'transparent';
  hoverHeader?: boolean;
}

export class ScenePanel extends SceneObjectBase<ScenePanelState> {
  public static Component = VizPanelRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title'],
  });

  public constructor(state: ScenePanelState) {
    super(state);
  }

  public interpolate = ((value: string, scoped?: ScopedVars, format?: string | VariableCustomFormatterFn) => {
    return sceneGraph.interpolate(this, value, scoped, format);
  }) as InterpolateFunction;
}

export function ScenePanelRenderer({ model }: SceneComponentProps<ScenePanel>) {
  const { title, description, $data, placement, menu, displayMode, hoverHeader, body } = model.useState();
  const [ref, { width, height }] = useMeasure();

  const parentLayout = sceneGraph.getLayout(model);

  // If parent has enabled dragging and we have not explicitly disabled it then dragging is enabled
  const isDraggable = parentLayout.isDraggable() && (placement?.isDraggable ?? true);
  const dragClass = isDraggable && parentLayout.getDragClass ? parentLayout.getDragClass() : '';
  const dragClassCancel = isDraggable && parentLayout.getDragClassCancel ? parentLayout.getDragClassCancel() : '';

  // Interpolate title
  const titleInterpolated = model.interpolate(title, undefined, 'text');

  // Subscribe to data and apply field overrides
  const { data } = sceneGraph.getData(model).useState();

  // If we have a query runner on our level inform it of the container width (used to set auto max data points)
  if ($data && $data.setContainerWidth) {
    $data.setContainerWidth(width);
  }

  const titleItems: React.ReactNode[] = [];

  // If we have local time range show that in panel header
  if (model.state.$timeRange) {
    titleItems.push(<model.state.$timeRange.Component model={model.state.$timeRange} />);
  }

  let panelMenu;
  if (menu) {
    panelMenu = <menu.Component model={menu} />;
  }

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <PanelChrome
        title={titleInterpolated}
        description={description ? () => model.interpolate(description) : ''}
        loadingState={data?.state}
        statusMessage={data?.error ? data.error.message : ''}
        width={width}
        height={height}
        displayMode={displayMode}
        hoverHeader={hoverHeader}
        titleItems={titleItems}
        dragClass={dragClass}
        dragClassCancel={dragClassCancel}
        menu={panelMenu}
      >
        {(innerWidth, innerHeight) => <body.Component model={body} />}
      </PanelChrome>
    </div>
  );
}
