import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
} from '@grafana/scenes';

import { demoUrl } from '../utils/utils.routing';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { Field } from '@grafana/data';
import React from 'react';

export function getCustomTooltipDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    url: demoUrl('custom-tooltip'),
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: PanelBuilders.timeseries()
                .setTitle('Panel 1')
                .setData(getQueryRunnerWithRandomWalkQuery())
                //@ts-expect-error
                .setCustomFieldConfig('tooltipSeriesComponent', VizTooltipItemCustomComponent)
                .build(),
            }),
          ],
        }),
      });
    },
  });
}

export interface VizTooltipItemCustomComponentProps {
  field: Field;
  isActive?: boolean;
  defaultRow: React.ReactNode;
}

function VizTooltipItemCustomComponent(props: VizTooltipItemCustomComponentProps) {
  return (
    <div>
      {props.defaultRow}
      <div>Custom tooltip content</div>
    </div>
  );
}
