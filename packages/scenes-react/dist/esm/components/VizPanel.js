import React, { useId, useEffect } from 'react';
import { VizPanel as VizPanel$1, SceneDataNode, DataProviderProxy } from '@grafana/scenes';
import { usePrevious } from 'react-use';
import { getPanelOptionsWithDefaults } from '@grafana/data';
import { writeSceneLog } from '../utils.js';
import { useSceneContext } from '../hooks/hooks.js';

function VizPanel(props) {
  const { title, viz, dataProvider, headerActions } = props;
  const scene = useSceneContext();
  const key = useId();
  const prevProps = usePrevious(props);
  let panel = scene.findByKey(key);
  if (!panel) {
    panel = new VizPanel$1({
      key,
      title,
      pluginId: viz.pluginId,
      pluginVersion: viz.pluginVersion,
      options: viz.options,
      fieldConfig: viz.fieldConfig,
      $data: getDataProviderForVizPanel(dataProvider),
      headerActions
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
    if (headerActions !== prevProps.headerActions) {
      stateUpdate.headerActions = headerActions;
    }
    if (dataProvider !== prevProps.dataProvider) {
      stateUpdate.$data = getDataProviderForVizPanel(dataProvider);
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
  }, [panel, title, headerActions, viz, dataProvider, prevProps]);
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
