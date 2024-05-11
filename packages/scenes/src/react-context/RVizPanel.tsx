import React, { useEffect, useId } from 'react';
import { SceneDataProvider } from '../core/types';
import { VizPanel, VizPanelState } from '../components/VizPanel/VizPanel';
import { DataProxyProvider } from './DataProxyProvider';
import { RVisualization } from './RVisualizationBuilder';
import { usePrevious } from 'react-use';
import { getPanelOptionsWithDefaults } from '@grafana/data';
import { writeSceneLog } from '../utils/writeSceneLog';
import { useSceneContext } from './hooks';

export interface RVizPanelProps {
  title: string;
  dataProvider?: SceneDataProvider;
  viz: RVisualization;
  headerActions?: React.ReactNode;
}

export function RVizPanel(props: RVizPanelProps) {
  const { title, viz, dataProvider, headerActions } = props;
  const scene = useSceneContext();
  const key = useId();
  const prevProps = usePrevious(props);

  let panel = scene.findByKey<VizPanel>(key);

  if (!panel) {
    panel = new VizPanel({
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
        const optionsWithDefaults = getPanelOptionsWithDefaults({
          plugin: panel.getPlugin(),
          currentOptions: viz.options,
          currentFieldConfig: viz.fieldConfig,
          isAfterPluginChange: false,
        });
        stateUpdate.options = optionsWithDefaults.options;
        stateUpdate.fieldConfig = optionsWithDefaults.fieldConfig;

        panel.clearFieldConfigCache();
      }
    }

    writeSceneLog('RVizPanel', 'Updating VizPanel state', stateUpdate);
    panel.setState(stateUpdate);
  }, [panel, title, headerActions, viz, dataProvider, prevProps]);

  return <panel.Component model={panel} />;
}

function getDataProviderForVizPanel(data: SceneDataProvider | undefined) {
  if (data && data.parent) {
    return new DataProxyProvider({ source: data.getRef() });
  }

  return data;
}
