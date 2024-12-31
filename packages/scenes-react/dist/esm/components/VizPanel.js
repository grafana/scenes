import React, { useId, useEffect } from 'react';
import { VizPanel as VizPanel$1, SceneDataNode, DataProviderProxy } from '@grafana/scenes';
import { usePrevious } from 'react-use';
import { getPanelOptionsWithDefaults } from '@grafana/data';
import { writeSceneLog } from '../utils.js';
import { useSceneContext } from '../hooks/hooks.js';

function VizPanel(props) {
  const {
    title,
    description,
    viz,
    dataProvider,
    displayMode,
    hoverHeader,
    hoverHeaderOffset,
    headerActions,
    menu,
    titleItems,
    extendPanelContext,
    seriesLimit,
    seriesLimitShowAll,
    collapsible,
    collapsed
  } = props;
  const scene = useSceneContext();
  const key = useId();
  const prevProps = usePrevious(props);
  let panel = scene.findByKey(key);
  if (!panel) {
    panel = new VizPanel$1({
      key,
      pluginId: viz.pluginId,
      title,
      titleItems,
      description,
      options: viz.options,
      fieldConfig: viz.fieldConfig,
      pluginVersion: viz.pluginVersion,
      $data: getDataProviderForVizPanel(dataProvider),
      displayMode,
      hoverHeader,
      hoverHeaderOffset,
      headerActions,
      menu,
      extendPanelContext,
      collapsible,
      collapsed,
      seriesLimit,
      seriesLimitShowAll
    });
  }
  useEffect(() => scene.addToScene(panel), [panel, scene]);
  useEffect(() => {
    const stateUpdate = {};
    if (!prevProps) {
      return;
    }
    if (title !== prevProps.title) {
      stateUpdate.title = title;
    }
    if (description !== prevProps.description) {
      stateUpdate.description = description;
    }
    if (displayMode !== prevProps.displayMode) {
      stateUpdate.displayMode = displayMode;
    }
    if (hoverHeader !== prevProps.hoverHeader) {
      stateUpdate.hoverHeader = hoverHeader;
    }
    if (hoverHeaderOffset !== prevProps.hoverHeaderOffset) {
      stateUpdate.hoverHeaderOffset = hoverHeaderOffset;
    }
    if (menu !== prevProps.menu) {
      stateUpdate.menu = menu;
    }
    if (titleItems !== prevProps.titleItems) {
      stateUpdate.titleItems = titleItems;
    }
    if (headerActions !== prevProps.headerActions) {
      stateUpdate.headerActions = headerActions;
    }
    if (dataProvider !== prevProps.dataProvider) {
      stateUpdate.$data = getDataProviderForVizPanel(dataProvider);
    }
    if (seriesLimit !== prevProps.seriesLimit) {
      stateUpdate.seriesLimit = seriesLimit;
    }
    if (seriesLimitShowAll !== prevProps.seriesLimitShowAll) {
      stateUpdate.seriesLimitShowAll = seriesLimitShowAll;
    }
    if (collapsible !== prevProps.collapsible) {
      stateUpdate.collapsible = collapsible;
    }
    if (collapsed !== prevProps.collapsed) {
      stateUpdate.collapsed = collapsed;
    }
    if (viz !== prevProps.viz) {
      if (viz.pluginId === prevProps.viz.pluginId) {
        const plugin = panel.getPlugin();
        if (plugin) {
          const optionsWithDefaults = getPanelOptionsWithDefaults({
            plugin,
            currentOptions: viz.options,
            currentFieldConfig: viz.fieldConfig,
            isAfterPluginChange: false
          });
          stateUpdate.options = optionsWithDefaults.options;
          stateUpdate.fieldConfig = optionsWithDefaults.fieldConfig;
          panel.clearFieldConfigCache();
        }
      }
    }
    if (Object.keys(stateUpdate).length > 0) {
      panel.setState(stateUpdate);
      writeSceneLog("VizPanel", "Updating VizPanel state", stateUpdate);
    }
  }, [
    panel,
    title,
    description,
    displayMode,
    hoverHeader,
    hoverHeaderOffset,
    headerActions,
    menu,
    titleItems,
    viz,
    dataProvider,
    seriesLimit,
    seriesLimitShowAll,
    collapsible,
    collapsed,
    prevProps
  ]);
  return /* @__PURE__ */ React.createElement(panel.Component, {
    model: panel
  });
}
function getDataProviderForVizPanel(data) {
  if (data && !(data instanceof SceneDataNode)) {
    return new DataProviderProxy({ source: data.getRef() });
  }
  return data;
}

export { VizPanel };
//# sourceMappingURL=VizPanel.js.map
