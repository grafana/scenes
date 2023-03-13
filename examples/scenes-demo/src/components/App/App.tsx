import * as React from 'react';
import { AppRootProps } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { EmbeddedScene, SceneFlexLayout, VizPanel } from '@grafana/scenes';

export function App(props: AppRootProps) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new VizPanel({
          title: 'Panel title',
        }),
      ],
    }),
  });

  return (
    <PluginPage>
      <scene.Component model={scene} />
    </PluginPage>
  );
}
