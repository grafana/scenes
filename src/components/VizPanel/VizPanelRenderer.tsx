import React from 'react';

import { PluginContextProvider, useFieldOverrides } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { ErrorBoundaryAlert, useTheme2 } from '@grafana/ui';

import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';

import { VizPanel } from './VizPanel';
import { PanelChromeRenderer } from '../PanelChromeRenderer';

export function VizPanelRenderer({ model }: SceneComponentProps<VizPanel>) {
  const theme = useTheme2();
  const { title, options, fieldConfig, pluginId, pluginLoadError } = model.useState();
  const plugin = model.getPlugin();
  const { data } = sceneGraph.getData(model).useState();

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
  return (
    <PanelChromeRenderer
      loadingState={dataWithOverrides?.state}
      statusMessage={dataWithOverrides?.error ? dataWithOverrides.error.message : ''}
      model={model}
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
    </PanelChromeRenderer>
  );
}

VizPanelRenderer.displayName = 'ScenePanelRenderer';
