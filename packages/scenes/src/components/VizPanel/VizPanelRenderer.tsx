import React, { RefCallback } from 'react';
import { useMeasure } from 'react-use';

import { PanelData, PluginContextProvider } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { PanelChrome, ErrorBoundaryAlert, PanelContextProvider } from '@grafana/ui';

import { sceneGraph } from '../../core/sceneGraph';
import { isSceneObject, SceneComponentProps, SceneLayout, SceneObject } from '../../core/types';

import { VizPanel } from './VizPanel';
import { css } from '@emotion/css';

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
  } = model.useState();
  const [ref, { width, height }] = useMeasure();
  const plugin = model.getPlugin();

  const { dragClass, dragClassCancel } = getDragClasses(model);
  const dataObject = sceneGraph.getData(model);
  const rawData = dataObject.useState();
  const dataWithFieldConfig = model.applyFieldConfig(rawData.data!);

  // Interpolate title
  const titleInterpolated = model.interpolate(title, undefined, 'text');

  // Not sure we need to subscribe to this state
  const timeZone = sceneGraph.getTimeRange(model).getTimeZone();

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
    titleItems.push(<model.state.$timeRange.Component model={model.state.$timeRange} key={model.state.key} />);
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
          {headerActions.map((action) => {
            return <action.Component model={action} key={`${action.state.key}`} />;
          })}
        </>
      );
    } else if (isSceneObject(headerActions)) {
      actionsElement = <headerActions.Component model={headerActions} />;
    } else {
      actionsElement = headerActions;
    }
  }

  // Data is always returned. For non-data panels, empty PanelData is returned.
  const data = dataWithFieldConfig!;
  const isReadyToRender = dataObject.isDataReadyToDisplay ? dataObject.isDataReadyToDisplay() : true;

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} className={wrapperDivStyles} data-viz-panel-key={model.state.key}>
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
                        onChangeTimeRange={model.onTimeRangeChange}
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

function getDragClasses(panel: VizPanel) {
  const parentLayout = sceneGraph.getLayout(panel);
  const isDraggable = parentLayout?.isDraggable();

  if (!parentLayout || !isDraggable || itemDraggingDisabled(panel, parentLayout)) {
    return { dragClass: '', dragClassCancel: '' };
  }

  return { dragClass: parentLayout.getDragClass?.(), dragClassCancel: parentLayout?.getDragClassCancel?.() };
}

/**
 * Walks up the parent chain until it hits the layout object, trying to find the closest SceneGridItemLike ancestor.
 * It is not always the direct parent, because the VizPanel can be wrapped in other objects.
 */
function itemDraggingDisabled(item: SceneObject, layout: SceneLayout) {
  let ancestor = item.parent;

  while (ancestor && ancestor !== layout) {
    if ('isDraggable' in ancestor.state && ancestor.state.isDraggable === false) {
      return true;
    }

    ancestor = ancestor.parent;
  }

  return false;
}

function getChromeStatusMessage(data: PanelData, pluginLoadingError: string | undefined) {
  if (pluginLoadingError) {
    return pluginLoadingError;
  }

  let message = data.error ? data.error.message : undefined;

  // Handling multiple errors with a single string until we integrate VizPanel with inspector
  if (data.errors) {
    message = data.errors.map((e) => e.message).join(', ');
  }
  return message;
}

const wrapperDivStyles = css({
  position: 'absolute',
  width: '100%',
  height: '100%',
});
