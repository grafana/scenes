import React, { RefCallback } from 'react';
import { useMeasure } from 'react-use';

import { PanelData, PluginContextProvider } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { PanelChrome, ErrorBoundaryAlert, PanelContextProvider } from '@grafana/ui';

import { sceneGraph } from '../../core/sceneGraph';
import { isSceneObject, SceneComponentProps } from '../../core/types';

import { VizPanel } from './VizPanel';

export function VizPanelRenderer({ model }: SceneComponentProps<VizPanel>) {
  const {
    title,
    description,
    options,
    fieldConfig,
    pluginLoadError,
    $data,
    displayMode,
    hoverHeader,
    menu,
    headerActions,
    ...state
  } = model.useState();
  const [ref, { width, height }] = useMeasure();
  const plugin = model.getPlugin();
  const parentLayout = sceneGraph.getLayout(model);

  // If parent has enabled dragging and we have not explicitly disabled it then dragging is enabled
  const isDraggable = parentLayout.isDraggable() && (state.isDraggable ?? true);
  const dragClass = isDraggable && parentLayout.getDragClass ? parentLayout.getDragClass() : '';
  const dragClassCancel = isDraggable && parentLayout.getDragClassCancel ? parentLayout.getDragClassCancel() : '';
  const dataObject = sceneGraph.getData(model);
  const rawData = dataObject.useState();
  const dataWithFieldConfig = model.applyFieldConfig(rawData.data!);

  // Interpolate title
  const titleInterpolated = model.interpolate(title, undefined, 'text');

  // Not sure we need to subscribe to this state
  const timeZone = sceneGraph.getTimeRange(model).getTimeZone();

  if (pluginLoadError) {
    return <div>Failed to load plugin: {pluginLoadError}</div>;
  }

  if (!plugin) {
    return <div>Loading plugin panel...</div>;
  }

  if (!plugin.panel) {
    return <div>Panel plugin has no panel component</div>;
  }

  const PanelComponent = plugin.panel;

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

  let actionsElement: React.ReactNode | undefined;

  if (headerActions) {
    if (Array.isArray(headerActions)) {
      actionsElement = (
        <>
          {headerActions.map((action, index) => {
            return (
              <React.Fragment key={`headerAction-${model.state.key}-${index}`}>
                <action.Component model={action} />
              </React.Fragment>
            );
          })}
        </>
      );
    } else {
      actionsElement = headerActions;
    }
  }

  // Data is always returned. For non-data panels, empty PanelData is returned.
  const data = dataWithFieldConfig!;
  const isReadyToRender = dataObject.isDataReadyToDisplay ? dataObject.isDataReadyToDisplay() : true;

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      {width > 0 && height > 0 && (
        <PanelChrome
          title={titleInterpolated}
          description={description ? () => model.interpolate(description) : ''}
          loadingState={data.state}
          statusMessage={getChromeStatusMessage(data, pluginLoadError)}
          width={width}
          height={height}
          displayMode={displayMode}
          hoverHeader={hoverHeader}
          titleItems={titleItems}
          dragClass={dragClass}
          actions={actionsElement}
          dragClassCancel={dragClassCancel}
          padding={plugin.noPadding ? 'none' : 'md'}
          menu={panelMenu}
          onCancelQuery={model.onCancelQuery}
        >
          {(innerWidth, innerHeight) => (
            <>
              <ErrorBoundaryAlert dependencies={[plugin, data]}>
                <PluginContextProvider meta={plugin.meta}>
                  <PanelContextProvider value={model.getPanelContext()}>
                    {isReadyToRender && (
                      <PanelComponent
                        id={1}
                        data={data}
                        title={title}
                        timeRange={data.timeRange}
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
                    )}
                  </PanelContextProvider>
                </PluginContextProvider>
              </ErrorBoundaryAlert>
            </>
          )}
        </PanelChrome>
      )}
    </div>
  );
}

function getChromeStatusMessage(data: PanelData, pluginLoadingError: string | undefined) {
  if (pluginLoadingError) {
    return pluginLoadingError;
  }

  return data.error ? data.error.message : undefined;
}
