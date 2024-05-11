import React, { useEffect, useId } from 'react';
import { SceneDataProvider } from '../core/types';
import { VizPanel, VizPanelState } from '../components/VizPanel/VizPanel';
import { DataProxyProvider } from './DataProxyProvider';
import { useSceneContext } from './SceneContextProvider';
import { RVisualization } from './RVisualizationBuilder';
import { usePrevious } from 'react-use';
import { getPanelOptionsWithDefaults } from '@grafana/data';
import { writeSceneLog } from '../utils/writeSceneLog';

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

  // Used to detect changing visualization
  const previousViz = usePrevious(viz);

  let panel = scene.findByKey<VizPanel>(key);

  if (!panel) {
    panel = new VizPanel({
      key: key,
      title: title,
      pluginId: viz.pluginId,
      pluginVersion: viz.pluginVersion,
      options: viz.options,
      fieldConfig: viz.fieldConfig,
      $data: new DataProxyProvider({ source: dataProvider.getRef() }),
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

    if (!previousViz) {
      return;
    }

    if (panel.state.title !== title) {
      stateUpdate.title = title;
    }

    if (panel.state.headerActions !== headerActions) {
      stateUpdate.headerActions = headerActions;
    }

    if (viz !== previousViz) {
      if (viz.pluginId === previousViz.pluginId) {
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
  }, [panel, title, headerActions, viz, previousViz]);

  return <panel.Component model={panel} />;
}
