import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  VizPanelExploreButton,
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
            new SceneCSSGridItem({
              body: PanelBuilders.timeseries()
                .setTitle('Panel with sm button')
                .setData(getQueryRunnerWithRandomWalkQuery())
                .setHeaderActions(
                  <Button size="sm" variant="secondary">
                    Does nothing
                  </Button>
                )
                .build(),
            }),
            new SceneCSSGridItem({
              body: PanelBuilders.timeseries()
                .setTitle('Panel with md button')
                .setData(getQueryRunnerWithRandomWalkQuery())
                .setHeaderActions(
                  <Button size="md" variant="secondary">
                    Does nothing
                  </Button>
                )
                .build(),
            }),
            new SceneCSSGridItem({
              body: PanelBuilders.timeseries()
                .setTitle('Panel with select')
                .setData(getQueryRunnerWithRandomWalkQuery())
                .setHeaderActions(
                  <Select options={[{ label: 'Option 1', value: '1' }]} onChange={() => {}} value="1" />
                )
                .build(),
            }),
            new SceneCSSGridItem({
              body: PanelBuilders.timeseries()
                .setTitle('Panel with explore button')
                .setData(getQueryRunnerWithRandomWalkQuery())
                .setHeaderActions(new VizPanelExploreButton())
                .build(),
            }),
          ],
        }),
      });
    },
  });
}
