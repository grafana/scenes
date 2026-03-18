import React from 'react';
import { PanelPlugin, PanelProps } from '@grafana/data';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimeRange,
  sceneUtils,
  VizPanel,
} from '@grafana/scenes';
import { LineInterpolation, TooltipDisplayMode } from '@grafana/schema';

export function getStandardVisualizations() {
  const myTimeSeriesPanel = PanelBuilders.timeseries().setTitle('My first panel');

  const data = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
    $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
  });

  myTimeSeriesPanel.setData(data);
  myTimeSeriesPanel.setOption('legend', { asTable: true }).setOption('tooltip', { mode: TooltipDisplayMode.Single });
  myTimeSeriesPanel.setDecimals(2).setUnit('ms');
  myTimeSeriesPanel.setCustomFieldConfig('lineInterpolation', LineInterpolation.Smooth);
  myTimeSeriesPanel.setOverrides((b) =>
    b.matchFieldsWithNameByRegex('/metrics/').overrideDecimals(4).overrideCustomFieldConfig('lineWidth', 5)
  );

  const myPanel = myTimeSeriesPanel.build();

  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: myPanel,
        }),
      ],
    }),
  });
}

export const getCustomVisualization = () => {
  const myCustomPanel = new PanelPlugin<CustomVizOptions, CustomVizFieldOptions>(CustomVizPanel).useFieldConfig({
    useCustomConfig: (builder) => {
      builder.addNumberInput({
        path: 'numericOption',
        name: 'Numeric option',
        description: 'A numeric option',
        defaultValue: 1,
      });
    },
  });
  sceneUtils.registerRuntimePanelPlugin({ pluginId: 'my-scene-app-my-custom-viz', plugin: myCustomPanel });

  const data = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
    $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
  });

  return new EmbeddedScene({
    $data: data,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: new VizPanel({
            pluginId: 'my-scene-app-my-custom-viz',
            options: { mode: 'my-custom-mode' },
            fieldConfig: {
              defaults: {
                unit: 'ms',
                custom: {
                  numericOption: 100,
                },
              },
              overrides: [],
            },
          }),
        }),
      ],
    }),
  });
};

interface CustomVizOptions {
  mode: string;
}

interface CustomVizFieldOptions {
  numericOption?: number;
}

interface Props extends PanelProps<CustomVizOptions> {}

function CustomVizPanel(props: Props) {
  const { options, data } = props;

  return (
    <div>
      <h4>
        CustomVizPanel options: <pre>{JSON.stringify(options)}</pre>
      </h4>
      <div>
        CustomVizPanel field config: <pre>{JSON.stringify(data.series[0]?.fields[0]?.config)}</pre>
      </div>
    </div>
  );
}
