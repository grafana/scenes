import { PanelPlugin, PanelProps } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneTimePicker,
  SceneFlexItem,
  EmbeddedScene,
  VizPanel,
  SceneRefreshPicker,
} from '@grafana/scenes';
import React from 'react';
import { getQueryRunnerWithRandomWalkQuery } from '../utils';

export function getCustomVizScene(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      $data: getQueryRunnerWithRandomWalkQuery(),
      children: [
        new SceneFlexItem({
          body: new VizPanel({
            title: 'Custom visualization panel plugin',
            pluginId: customVizPanelPlugin,
            fieldConfig: {
              defaults: {
                displayName: '${__field.labels.cluster}',
              },
              overrides: [],
            },
          }),
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({}), new SceneRefreshPicker({})],
  });
}

interface CustomVizOptions {
  mode: string;
}

interface CustomVizFieldOptions {
  numericOption: number;
}

const customVizPanelPlugin = new PanelPlugin<CustomVizOptions, CustomVizFieldOptions>(CustomVizPanel)
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
