import React, { RefCallback } from 'react';
import { useMeasure } from 'react-use';

import { PluginContextProvider, useFieldOverrides } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { PanelChrome, ErrorBoundaryAlert, useTheme2 } from '@grafana/ui';

import { sceneGraph } from '../../core/sceneGraph';
import { isSceneQueryRunner, SceneComponentProps } from '../../core/types';

import { VizPanel } from './VizPanel';

export function VizPanelRenderer({ model }: SceneComponentProps<VizPanel>) {
  const theme = useTheme2();
  const {
    title,
    description,
    options,
    fieldConfig,
    pluginId,
    pluginLoadError,
    $data,
    placement,
    displayMode,
    hoverHeader,
  } = model.useState();
  const [ref, { width, height }] = useMeasure();
  const plugin = model.getPlugin();
  const { data } = sceneGraph.getData(model).useState();
  const parentLayout = sceneGraph.getLayout(model);

  // If parent has enabled dragging and we have not explicitly disabled it then dragging is enabled
  const isDraggable = parentLayout.isDraggable() && (placement?.isDraggable ?? true);
  const dragClass = isDraggable && parentLayout.getDragClass ? parentLayout.getDragClass() : '';
  const dragClassCancel = isDraggable && parentLayout.getDragClassCancel ? parentLayout.getDragClassCancel() : '';

  // Interpolate title
  const titleInterpolated = model.interpolate(title, undefined, 'text');

  // Not sure we need to subscribe to this state
  const timeZone = sceneGraph.getTimeRange(model).state.timeZone;
  const dataWithOverrides = useFieldOverrides(plugin, fieldConfig, data, timeZone, theme, model.interpolate);

  if (pluginLoadError) {
    return <div>Failed to load plugin: {pluginLoadError}</div>;
  }

  if (!plugin || !plugin.hasPluginId(pluginId)) {
    return <div>Loading plugin panel...</div>;
  }

  if (!plugin.panel) {
    return <div>Panel plugin has no panel component</div>;
  }

  const PanelComponent = plugin.panel;

  // If we have a query runner on our level inform it of the container width (used to set auto max data points)
  if ($data && isSceneQueryRunner($data)) {
    $data.setContainerWidth(width);
  }

  const titleItems: React.ReactNode[] = [];

  // If we have local time range show that in panel header
  if (model.state.$timeRange) {
    titleItems.push(<model.state.$timeRange.Component model={model.state.$timeRange} />);
  }

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <PanelChrome
        title={titleInterpolated}
        description={description ? () => model.interpolate(description) : ''}
        loadingState={dataWithOverrides?.state}
        statusMessage={dataWithOverrides?.error ? dataWithOverrides.error.message : ''}
        width={width}
        height={height}
        displayMode={displayMode}
        hoverHeader={hoverHeader}
        titleItems={titleItems}
        dragClass={dragClass}
        dragClassCancel={dragClassCancel}
      >
        {(innerWidth, innerHeight) => (
          <>
            {!dataWithOverrides && <div>No data...</div>}
            {dataWithOverrides && (
              <ErrorBoundaryAlert dependencies={[plugin, data]}>
                <PluginContextProvider meta={plugin.meta}>
                  <PanelComponent
                    id={1}
                    data={dataWithOverrides}
                    title={title}
                    timeRange={dataWithOverrides.timeRange}
                    timeZone={timeZone}
                    options={options}
                    fieldConfig={fieldConfig}
                    transparent={false}
                    width={innerWidth}
                    height={innerHeight}
                    renderCounter={0}
                    replaceVariables={model.interpolate}
                    onOptionsChange={model.onOptionsChange}
                    onFieldConfigChange={model.onFieldConfigChange}
                    onChangeTimeRange={model.onChangeTimeRange}
                    eventBus={getAppEvents()}
                  />
                </PluginContextProvider>
              </ErrorBoundaryAlert>
            )}
          </>
        )}
      </PanelChrome>
    </div>
  );
}

VizPanelRenderer.displayName = 'ScenePanelRenderer';
