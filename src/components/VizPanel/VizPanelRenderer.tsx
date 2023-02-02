import React, { RefCallback, useMemo } from 'react';
import { useMeasure } from 'react-use';

import { PluginContextProvider, useFieldOverrides, ScopedVars, InterpolateFunction } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { PanelChrome, ErrorBoundaryAlert, useTheme2 } from '@grafana/ui';

import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneDragHandle } from '../SceneDragHandle';

import { VizPanel } from './VizPanel';
import { CustomFormatterFn } from '../../variables/interpolation/sceneInterpolator';

export function VizPanelRenderer({ model }: SceneComponentProps<VizPanel>) {
  const theme = useTheme2();
  const replace = useMemo(
    () => (value: string, scoped?: ScopedVars, format?: string | CustomFormatterFn) =>
      sceneGraph.interpolate(model, value, scoped, format),
    [model]
  ) as InterpolateFunction;
  const { title, description, options, fieldConfig, pluginId, pluginLoadError, $data, placement } = model.useState();
  const [ref, { width, height }] = useMeasure();
  const plugin = model.getPlugin();
  const { data } = sceneGraph.getData(model).useState();
  const parentLayout = sceneGraph.getLayout(model);

  // TODO: this should probably be parentLayout.isDraggingEnabled() ? placement?.isDraggable : false
  // The current logic is not correct, just because parent layout itself is not draggable does not mean children are not
  const isDraggable = parentLayout.state.placement?.isDraggable ? placement?.isDraggable : false;
  const dragHandle = <SceneDragHandle layoutKey={parentLayout.state.key!} />;

  const titleInterpolated = replace(title, undefined, 'text');

  // Not sure we need to subscribe to this state
  const timeZone = sceneGraph.getTimeRange(model).state.timeZone;

  const dataWithOverrides = useFieldOverrides(plugin, fieldConfig, data, timeZone, theme, replace);

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

  // Query runner needs to with for auto maxDataPoints
  if ($data instanceof SceneQueryRunner) {
    $data.setContainerWidth(width);
  }

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <PanelChrome
        title={titleInterpolated}
        description={description ? () => replace(description) : ''}
        loadingState={dataWithOverrides?.state}
        statusMessage={dataWithOverrides?.error ? dataWithOverrides.error.message : ''}
        width={width}
        height={height}
        titleItems={isDraggable ? [dragHandle] : []}
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
                    replaceVariables={replace}
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
