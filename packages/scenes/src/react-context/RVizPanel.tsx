import React, { useId, useMemo } from 'react';
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
  const id = useId();

  const panel = useMemo(() => {
    let panel = scene.state.children.find((x) => x.state.key === id);

    if (!panel) {
      panel = new VizPanel({
        key: id,
        pluginId: 'timeseries',
        title: props.title,
        $data: new DataProxyProvider({ source: props.dataProvider.getRef() }),
      });
      scene.setState({ children: [...scene.state.children, panel] });

      panel.addActivationHandler(() => {
        return () => {
          console.log('removing viz panel');
          scene.setState({ children: scene.state.children.filter((x) => x !== panel) });
        };
      });
    } else {
      // Update props
    }
    return panel;
  }, [scene, props, id]);

  return <panel.Component model={panel} />;
}
