import React, { RefCallback } from 'react';
import { useMeasure } from 'react-use';

import { AlertState, GrafanaTheme2, PanelData, PluginContextProvider } from '@grafana/data';
// @ts-ignore
import { getAppEvents, getPanelAttentionSrv } from '@grafana/runtime';
import { PanelChrome, ErrorBoundaryAlert, PanelContextProvider, Tooltip, useStyles2, Icon } from '@grafana/ui';

import { sceneGraph } from '../../core/sceneGraph';
import { isSceneObject, SceneComponentProps, SceneLayout, SceneObject } from '../../core/types';

import { VizPanel } from './VizPanel';
import { css, cx } from '@emotion/css';

export function VizPanelRenderer({ model }: SceneComponentProps<VizPanel>) {
  const {
    title,
    options,
    fieldConfig,
    _pluginLoadError,
    displayMode,
    hoverHeader,
    hoverHeaderOffset,
    menu,
    headerActions,
    titleItems,
    description,
  } = model.useState();
  const [ref, { width, height }] = useMeasure();
  const panelAttentionService = getPanelAttentionSrv();
  const plugin = model.getPlugin();

  const { dragClass, dragClassCancel } = getDragClasses(model);
  const dataObject = sceneGraph.getData(model);

  const rawData = dataObject.useState();
  const dataWithFieldConfig = model.applyFieldConfig(rawData.data!);
  const sceneTimeRange = sceneGraph.getTimeRange(model);
  const timeZone = sceneTimeRange.getTimeZone();
  const timeRange = model.getTimeRange(dataWithFieldConfig);

  // Interpolate title
  const titleInterpolated = model.interpolate(title, undefined, 'text');

  const alertStateStyles = useStyles2(getAlertStateStyles);

  if (!plugin) {
    return <div>Loading plugin panel...</div>;
  }

  if (!plugin.panel) {
    return <div>Panel plugin has no panel component</div>;
  }

  const PanelComponent = plugin.panel;

  // If we have a query runner on our level inform it of the container width (used to set auto max data points)
  if (dataObject && dataObject.setContainerWidth) {
    dataObject.setContainerWidth(Math.round(width));
  }

  let titleItemsElement: React.ReactNode[] = [];

  if (titleItems) {
    if (Array.isArray(titleItems)) {
      titleItemsElement = titleItemsElement.concat(
        titleItems.map((titleItem) => {
          return <titleItem.Component model={titleItem} key={`${titleItem.state.key}`} />;
        })
      );
    } else if (isSceneObject(titleItems)) {
      titleItemsElement.push(<titleItems.Component model={titleItems} />);
    } else {
      titleItemsElement.push(titleItems);
    }
  }

  // If we have local time range show that in panel header
  if (model.state.$timeRange) {
    titleItemsElement.push(<model.state.$timeRange.Component model={model.state.$timeRange} key={model.state.key} />);
  }

  if (dataWithFieldConfig.alertState) {
    titleItemsElement.push(
      <Tooltip content={dataWithFieldConfig.alertState.state ?? 'unknown'} key={`alert-states-icon-${model.state.key}`}>
        <PanelChrome.TitleItem
          className={cx({
            [alertStateStyles.ok]: dataWithFieldConfig.alertState.state === AlertState.OK,
            [alertStateStyles.pending]: dataWithFieldConfig.alertState.state === AlertState.Pending,
            [alertStateStyles.alerting]: dataWithFieldConfig.alertState.state === AlertState.Alerting,
          })}
        >
          <Icon
            name={dataWithFieldConfig.alertState.state === 'alerting' ? 'heart-break' : 'heart'}
            className="panel-alert-icon"
            size="md"
          />
        </PanelChrome.TitleItem>
      </Tooltip>
    );
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

  const context = model.getPanelContext();
  const panelId = model.getLegacyPanelId();

  return (
    <div className={relativeWrapper}>
      <div
        ref={ref as RefCallback<HTMLDivElement>}
        className={absoluteWrapper}
        onFocus={() => panelAttentionService?.setPanelWithAttention(model.state.key)}
        onMouseMove={() => panelAttentionService?.setPanelWithAttention(model.state.key)}
        data-viz-panel-key={model.state.key}
      >
        {width > 0 && height > 0 && (
          <PanelChrome
            title={titleInterpolated}
            description={description?.trim() ? model.getDescription : undefined}
            loadingState={data.state}
            statusMessage={getChromeStatusMessage(data, _pluginLoadError)}
            statusMessageOnClick={model.onStatusMessageClick}
            width={width}
            height={height}
            displayMode={displayMode}
            hoverHeader={hoverHeader}
            hoverHeaderOffset={hoverHeaderOffset}
            titleItems={titleItemsElement}
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
                    <PanelContextProvider value={context}>
                      {isReadyToRender && (
                        <PanelComponent
                          id={panelId}
                          data={data}
                          title={title}
                          timeRange={timeRange}
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

const relativeWrapper = css({
  position: 'relative',
  width: '100%',
  height: '100%',
});

/**
 * Sadly this this absolute wrapper is needed for the panel to adopt smaller sizes.
 * The combo of useMeasure and PanelChrome makes the panel take up the width it get's but that makes it impossible to
 * Then adapt to smaller space (say resizing the browser window or undocking menu).
 */
const absoluteWrapper = css({
  position: 'absolute',
  width: '100%',
  height: '100%',
});

const getAlertStateStyles = (theme: GrafanaTheme2) => {
  return {
    ok: css({
      color: theme.colors.success.text,
    }),
    pending: css({
      color: theme.colors.warning.text,
    }),
    alerting: css({
      color: theme.colors.error.text,
    }),
  };
};
