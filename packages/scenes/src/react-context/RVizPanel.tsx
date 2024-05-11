import React, { useEffect, useId } from 'react';
import { SceneDataProvider } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { DataProxyProvider } from './DataProxyProvider';
import { useSceneContext } from './SceneContextProvider';

export interface RVizPanelProps {
  title: string;
  dataProvider?: SceneDataProvider;
}

export function RVizPanel(props: RVizPanelProps) {
  const scene = useSceneContext();
  const key = useId();

  let panel = scene.findByKey<VizPanel>(key);

  if (!panel) {
    panel = new VizPanel({
      key: key,
      pluginId: 'timeseries',
      title: props.title,
      $data: new DataProxyProvider({ source: props.dataProvider.getRef() }),
    });
  }

  useEffect(() => {
    console.log('adding panel', key);
    scene.addToScene(panel);

    return () => {
      console.log('removing panel', key);
      scene.removeFromScene(panel);
    };
  }, [panel, scene, key]);

  // Update options
  useEffect(() => {
    if (panel.state.title !== props.title) {
      panel.setState({ title: props.title });
    }
  }, [panel, props.title]);

  return <panel.Component model={panel} />;
}
