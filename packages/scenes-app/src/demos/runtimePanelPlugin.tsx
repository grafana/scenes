import { PanelPlugin, PanelProps } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneFlexItem,
  EmbeddedScene,
  VizPanel,
  SceneAppPageState,
  SceneAppPage,
  sceneUtils,
} from '@grafana/scenes';
import React from 'react';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getRuntimePanelPluginDemo(defaults: SceneAppPageState): SceneAppPage {
  sceneUtils.registerRuntimePanelPlugin({ pluginId: 'custom-viz-panel', plugin: getCustomVizPlugin() });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          ...getEmbeddedSceneDefaults(),
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                title: 'Custom visualization panel plugin',
                pluginId: 'custom-viz-panel',
                $data: getQueryRunnerWithRandomWalkQuery(),
                fieldConfig: {
                  defaults: {},
                  overrides: [],
                },
              }),
            }),
          ],
        }),
      });
    },
  });
}

interface CustomVizOptions {
  mode: string;
}

interface CustomVizFieldOptions {
  numericOption?: number;
}

function getCustomVizPlugin() {
  return new PanelPlugin<CustomVizOptions, CustomVizFieldOptions>(CustomVizPanel)
    .setPanelOptions((builder) => {
      builder.addTextInput({
        path: 'mode',
        name: 'Mode',
        defaultValue: 'modeA',
      });
    })
    .useFieldConfig({
      useCustomConfig: (builder) => {
        builder.addNumberInput({
          path: 'numericOption',
          name: 'Option editor',
          description: 'Option editor description',
          defaultValue: 10,
        });
      },
    });
}

export interface Props extends PanelProps<CustomVizOptions> {}

export function CustomVizPanel(props: Props) {
  const { options, data } = props;

  return (
    <div>
      <h4>CustomVizPanel {options.mode}</h4>
      <div>FieldConfig: {JSON.stringify(data.series[0]?.fields[0]?.config?.custom)}</div>
    </div>
  );
}
