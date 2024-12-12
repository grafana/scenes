import React, { useMemo, useCallback } from 'react';
import { useMeasure } from 'react-use';
import { SetPanelAttentionEvent, AlertState, rangeUtil, PluginContextProvider } from '@grafana/data';
import { getAppEvents, getDataSourceSrv } from '@grafana/runtime';
import { useStyles2, Tooltip, PanelChrome, Icon, Button, ErrorBoundaryAlert, PanelContextProvider } from '@grafana/ui';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { isSceneObject } from '../../core/types.js';
import { css, cx } from '@emotion/css';
import { debounce } from 'lodash';

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
function VizPanelRenderer({ model }) {
  var _a, _b, _c, _d, _e;
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
    _renderCounter = 0
  } = model.useState();
  const [ref, { width, height }] = useMeasure();
  const appEvents = useMemo(() => getAppEvents(), []);
  const setPanelAttention = useCallback(() => {
    appEvents.publish(new SetPanelAttentionEvent({ panelId: model.state.key }));
  }, [model.state.key, appEvents]);
  const debouncedMouseMove = useMemo(
    () => debounce(setPanelAttention, 100, { leading: true, trailing: false }),
    [setPanelAttention]
  );
  const plugin = model.getPlugin();
  const { dragClass, dragClassCancel } = getDragClasses(model);
  const dataObject = sceneGraph.getData(model);
  const rawData = dataObject.useState();
  const dataWithFieldConfig = model.applyFieldConfig(rawData.data);
  const sceneTimeRange = sceneGraph.getTimeRange(model);
  const timeZone = sceneTimeRange.getTimeZone();
  const timeRange = model.getTimeRange(dataWithFieldConfig);
  const titleInterpolated = model.interpolate(title, void 0, "text");
  const alertStateStyles = useStyles2(getAlertStateStyles);
  if (!plugin) {
    return /* @__PURE__ */ React.createElement("div", null, "Loading plugin panel...");
  }
  if (!plugin.panel) {
    return /* @__PURE__ */ React.createElement("div", null, "Panel plugin has no panel component");
  }
  const PanelComponent = plugin.panel;
  if (dataObject && dataObject.setContainerWidth) {
    dataObject.setContainerWidth(Math.round(width));
  }
  let titleItemsElement = [];
  if (titleItems) {
    if (Array.isArray(titleItems)) {
      titleItemsElement = titleItemsElement.concat(
        titleItems.map((titleItem) => {
          return /* @__PURE__ */ React.createElement(titleItem.Component, {
            model: titleItem,
            key: `${titleItem.state.key}`
          });
        })
      );
    } else if (isSceneObject(titleItems)) {
      titleItemsElement.push(/* @__PURE__ */ React.createElement(titleItems.Component, {
        model: titleItems
      }));
    } else {
      titleItemsElement.push(titleItems);
    }
  }
  if (model.state.$timeRange) {
    titleItemsElement.push(/* @__PURE__ */ React.createElement(model.state.$timeRange.Component, {
      model: model.state.$timeRange,
      key: model.state.key
    }));
  }
  if (dataWithFieldConfig.alertState) {
    titleItemsElement.push(
      /* @__PURE__ */ React.createElement(Tooltip, {
        content: (_a = dataWithFieldConfig.alertState.state) != null ? _a : "unknown",
        key: `alert-states-icon-${model.state.key}`
      }, /* @__PURE__ */ React.createElement(PanelChrome.TitleItem, {
        className: cx({
          [alertStateStyles.ok]: dataWithFieldConfig.alertState.state === AlertState.OK,
          [alertStateStyles.pending]: dataWithFieldConfig.alertState.state === AlertState.Pending,
          [alertStateStyles.alerting]: dataWithFieldConfig.alertState.state === AlertState.Alerting
        })
      }, /* @__PURE__ */ React.createElement(Icon, {
        name: dataWithFieldConfig.alertState.state === "alerting" ? "heart-break" : "heart",
        className: "panel-alert-icon",
        size: "md"
      })))
    );
  }
  let panelMenu;
  if (menu) {
    panelMenu = /* @__PURE__ */ React.createElement(menu.Component, {
      model: menu
    });
  }
  let actionsElement;
  if (headerActions) {
    if (Array.isArray(headerActions)) {
      actionsElement = /* @__PURE__ */ React.createElement(React.Fragment, null, headerActions.map((action) => {
        return /* @__PURE__ */ React.createElement(action.Component, {
          model: action,
          key: `${action.state.key}`
        });
      }));
    } else if (isSceneObject(headerActions)) {
      actionsElement = /* @__PURE__ */ React.createElement(headerActions.Component, {
        model: headerActions
      });
    } else {
      actionsElement = headerActions;
    }
  }
  const data = dataWithFieldConfig;
  const isReadyToRender = dataObject.isDataReadyToDisplay ? dataObject.isDataReadyToDisplay() : true;
  const context = model.getPanelContext();
  const panelId = model.getLegacyPanelId();
  let datasource = null;
  if ((_d = (_c = (_b = data.request) == null ? void 0 : _b.targets) == null ? void 0 : _c.length) != null ? _d : 0 > 0) {
    datasource = (_e = data.request) == null ? void 0 : _e.targets[0].datasource;
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: relativeWrapper
  }, /* @__PURE__ */ React.createElement("div", {
    ref,
    className: absoluteWrapper,
    "data-viz-panel-key": model.state.key
  }, width > 0 && height > 0 && /* @__PURE__ */ React.createElement(PanelChrome, {
    title: titleInterpolated,
    description: (description == null ? void 0 : description.trim()) ? model.getDescription : void 0,
    loadingState: data.state,
    statusMessage: getChromeStatusMessage(data, _pluginLoadError),
    statusMessageOnClick: model.onStatusMessageClick,
    width,
    height,
    displayMode,
    hoverHeader,
    hoverHeaderOffset,
    titleItems: titleItemsElement,
    dragClass,
    actions: actionsElement,
    dragClassCancel,
    padding: plugin.noPadding ? "none" : "md",
    menu: panelMenu,
    onCancelQuery: model.onCancelQuery,
    onFocus: setPanelAttention,
    onMouseEnter: setPanelAttention,
    onMouseMove: debouncedMouseMove
  }, (innerWidth, innerHeight) => /* @__PURE__ */ React.createElement(React.Fragment, null, plugin.meta.id === "timeseries" && /* @__PURE__ */ React.createElement(Button, {
    style: { top: "-32px", right: "28px", position: "absolute", border: 0, padding: 0 },
    variant: "secondary",
    fill: "outline",
    type: "button",
    "data-testid": "send-query-button",
    tooltip: "Oodle insight",
    tooltipPlacement: "top",
    hidden: (datasource == null ? void 0 : datasource.type) !== "prometheus",
    onClick: () => {
      var _a2, _b2;
      const variables = __spreadValues({}, (_a2 = data == null ? void 0 : data.request) == null ? void 0 : _a2.scopedVars);
      variables.__interval = {
        value: "$__interval"
      };
      variables.__interval_ms = {
        value: "$__interval_ms"
      };
      let timeRange2 = rangeUtil.convertRawToRange((_b2 = data.request) == null ? void 0 : _b2.rangeRaw);
      let rangeDurationMs = timeRange2.to.valueOf() - timeRange2.from.valueOf();
      getDataSourceSrv().get(datasource, variables).then((ds) => {
        var _a3, _b3, _c2, _d2, _e2, _f;
        if (ds.interpolateVariablesInQueries) {
          let targets = ds.interpolateVariablesInQueries((_a3 = data.request) == null ? void 0 : _a3.targets, variables);
          sendOodleInsightEvent(
            (_b3 = data.request) == null ? void 0 : _b3.dashboardUID,
            "Insights",
            model.state.title,
            (_c2 = data.request) == null ? void 0 : _c2.panelId,
            targets,
            timeRange2,
            rangeDurationMs,
            (_f = (_e2 = (_d2 = model.state) == null ? void 0 : _d2.fieldConfig) == null ? void 0 : _e2.defaults) == null ? void 0 : _f.unit
          );
        } else {
          throw new Error("datasource does not support variable interpolation");
        }
      }).catch((_) => {
        var _a3, _b3, _c2, _d2, _e2, _f;
        sendOodleInsightEvent(
          (_a3 = data.request) == null ? void 0 : _a3.dashboardUID,
          "Insights",
          model.state.title,
          (_b3 = data.request) == null ? void 0 : _b3.panelId,
          (_c2 = data.request) == null ? void 0 : _c2.targets,
          timeRange2,
          rangeDurationMs,
          (_f = (_e2 = (_d2 = model.state) == null ? void 0 : _d2.fieldConfig) == null ? void 0 : _e2.defaults) == null ? void 0 : _f.unit
        );
      });
    }
  }, /* @__PURE__ */ React.createElement("img", {
    src: "https://imagedelivery.net/oP5rEbdkySYwiZY4N9HGRw/d0e74e50-902c-4b3c-90af-cabc367bcb00/public",
    alt: "Insight icon",
    "data-testid": "insight-icon",
    style: { height: "25px" }
  })), /* @__PURE__ */ React.createElement(ErrorBoundaryAlert, {
    dependencies: [plugin, data]
  }, /* @__PURE__ */ React.createElement(PluginContextProvider, {
    meta: plugin.meta
  }, /* @__PURE__ */ React.createElement(PanelContextProvider, {
    value: context
  }, isReadyToRender && /* @__PURE__ */ React.createElement(PanelComponent, {
    id: panelId,
    data,
    title: "TEST TITLE",
    timeRange,
    timeZone,
    options,
    fieldConfig,
    transparent: false,
    width: innerWidth,
    height: innerHeight,
    renderCounter: _renderCounter,
    replaceVariables: model.interpolate,
    onOptionsChange: model.onOptionsChange,
    onFieldConfigChange: model.onFieldConfigChange,
    onChangeTimeRange: model.onTimeRangeChange,
    eventBus: context.eventBus
  }))))))));
}
const sendOodleInsightEvent = (dashboardUId, dashboardTitle, panelTitle, panelId, expressionData, dashboardTime, rangeDurationMs, unit) => {
  const eventData = {
    dashboardUId,
    dashboardTitle,
    panelTitle,
    panelId,
    expressionData,
    dashboardTime,
    rangeDurationMs,
    unit
  };
  sendEventToParent({
    type: "message",
    payload: {
      source: "oodle-grafana",
      eventType: "sendQuery",
      value: JSON.parse(JSON.stringify(eventData))
    }
  });
};
function sendEventToParent(data) {
  window.parent.postMessage(data, "*");
}
function getDragClasses(panel) {
  var _a, _b;
  const parentLayout = sceneGraph.getLayout(panel);
  const isDraggable = parentLayout == null ? void 0 : parentLayout.isDraggable();
  if (!parentLayout || !isDraggable || itemDraggingDisabled(panel, parentLayout)) {
    return { dragClass: "", dragClassCancel: "" };
  }
  return { dragClass: (_a = parentLayout.getDragClass) == null ? void 0 : _a.call(parentLayout), dragClassCancel: (_b = parentLayout == null ? void 0 : parentLayout.getDragClassCancel) == null ? void 0 : _b.call(parentLayout) };
}
function itemDraggingDisabled(item, layout) {
  let ancestor = item.parent;
  while (ancestor && ancestor !== layout) {
    if ("isDraggable" in ancestor.state && ancestor.state.isDraggable === false) {
      return true;
    }
    ancestor = ancestor.parent;
  }
  return false;
}
function getChromeStatusMessage(data, pluginLoadingError) {
  if (pluginLoadingError) {
    return pluginLoadingError;
  }
  let message = data.error ? data.error.message : void 0;
  if (data.errors) {
    message = data.errors.map((e) => e.message).join(", ");
  }
  return message;
}
const relativeWrapper = css({
  position: "relative",
  width: "100%",
  height: "100%"
});
const absoluteWrapper = css({
  position: "absolute",
  width: "100%",
  height: "100%"
});
const getAlertStateStyles = (theme) => {
  return {
    ok: css({
      color: theme.colors.success.text
    }),
    pending: css({
      color: theme.colors.warning.text
    }),
    alerting: css({
      color: theme.colors.error.text
    })
  };
};

export { VizPanelRenderer };
//# sourceMappingURL=VizPanelRenderer.js.map
