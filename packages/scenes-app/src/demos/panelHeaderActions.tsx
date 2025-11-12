import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridLayout,
  VizPanelExploreButton,
  VizPanelMenu,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { Button, Select } from '@grafana/ui';
import React from 'react';

export function getPanelHeaderActions(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        body: new SceneCSSGridLayout({
          templateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          autoRows: '320px',
          children: [
            PanelBuilders.timeseries()
              .setTitle('Panel with explore button')
              .setData(getQueryRunnerWithRandomWalkQuery())
              .setHeaderActions(new VizPanelExploreButton())
              .build(),
            PanelBuilders.timeseries()
              .setTitle('Panel sm button and menu')
              .setData(getQueryRunnerWithRandomWalkQuery())
              .setHeaderActions(new VizPanelExploreButton())
              .setMenu(new VizPanelMenu({ items: [{ text: 'Option 1' }] }))
              .build(),
            PanelBuilders.timeseries()
              .setTitle('Panel sm button and menu always show menu')
              .setData(getQueryRunnerWithRandomWalkQuery())
              .setHeaderActions(new VizPanelExploreButton())
              .setMenu(new VizPanelMenu({ items: [{ text: 'Option 1' }] }))
              .setShowMenuAlways(true)
              .build(),
            PanelBuilders.timeseries()
              .setTitle('Panel with md button')
              .setData(getQueryRunnerWithRandomWalkQuery())
              .setHeaderActions(
                <Button size="md" variant="secondary">
                  Does nothing
                </Button>
              )
              .build(),
            PanelBuilders.timeseries()
              .setTitle('Panel with select')
              .setData(getQueryRunnerWithRandomWalkQuery())
              .setHeaderActions(<Select options={[{ label: 'Option 1', value: '1' }]} onChange={() => {}} value="1" />)
              .build(),
          ],
        }),
      });
    },
  });
}
