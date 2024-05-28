import React, { useEffect, useId } from 'react';
import {
  SceneDataProvider,
  VizPanel as VizPanelObject,
  VizPanelState,
  VisualizationConfig,
  SceneQueryRunner,
} from '@grafana/scenes';
import { DataProxyProvider } from '../DataProxyProvider';
import { usePrevious } from 'react-use';
import { getPanelOptionsWithDefaults } from '@grafana/data';
import { writeSceneLog } from '../utils';
import { useSceneContext } from '../hooks/hooks';

export interface VizPanelProps {
  title: string;
  dataProvider?: SceneDataProvider;
  viz: VisualizationConfig;
  headerActions?: React.ReactNode;
}

export function VizPanel(props: VizPanelProps) {
  const { title, viz, dataProvider, headerActions } = props;
  const scene = useSceneContext();
  const key = useId();
  const prevProps = usePrevious(props);

  let panel = scene.findByKey<VizPanelObject>(key);

  if (!panel) {
    panel = new VizPanelObject({
      key: key,
      title: title,
      pluginId: viz.pluginId,
      pluginVersion: viz.pluginVersion,
      options: viz.options,
      fieldConfig: viz.fieldConfig,
      $data: getDataProviderForVizPanel(dataProvider),
      headerActions: headerActions,
    });
  }

  useEffect(() => {
    scene.addToScene(panel);

    return () => {
      scene.removeFromScene(panel);
    };
  }, [panel, scene, key]);

  // Update options
  useEffect(() => {
    const stateUpdate: Partial<VizPanelState> = {};

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
            isAfterPluginChange: false,
          });
          stateUpdate.options = optionsWithDefaults.options;
          stateUpdate.fieldConfig = optionsWithDefaults.fieldConfig;

          panel.clearFieldConfigCache();
        }
      }
    }

    writeSceneLog('RVizPanel', 'Updating VizPanel state', stateUpdate);
    panel.setState(stateUpdate);
  }, [panel, title, headerActions, viz, dataProvider, prevProps]);

  return <panel.Component model={panel} />;
}

/**
 * Since the useSceneQuery attaches query runners to the scene context their parent is already set
 * This proxy is to work around that.
 * TODO: Figure out a better way to handle this'
 */
function getDataProviderForVizPanel(data: SceneDataProvider | undefined): SceneDataProvider | undefined {
  if (data instanceof SceneQueryRunner) {
    return new DataProxyProvider({ source: data.getRef() });
  }
  return data;
}
