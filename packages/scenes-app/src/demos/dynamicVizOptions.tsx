import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { RadioButtonGroup } from '@grafana/ui';
import React from 'react';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDynamicVizOptionsDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A panel with actions that change visualization settings',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                title: 'Graph',
                pluginId: 'timeseries',
                $data: getQueryRunnerWithRandomWalkQuery({ seriesCount: 3, spread: 15 }, { maxDataPoints: 50 }),
                headerActions: new VizOptions({ value: 'graph' }),
              }),
            }),
          ],
        }),
      });
    },
  });
}

interface VizOptionsState extends SceneObjectState {
  value: string;
}

class VizOptions extends SceneObjectBase<VizOptionsState> {
  public onChange = (value: string) => {
    this.setState({ value });

    const viz = this.parent as VizPanel;

    switch (value) {
      case 'lines':
        viz.setState({
          fieldConfig: {
            defaults: {},
            overrides: [],
          },
        });
      case 'bars_stacked':
        viz.setState({
          fieldConfig: {
            defaults: {
              custom: {
                stacking: {
                  mode: 'normal',
                  group: 'A',
                },
                fillOpacity: 35,
                drawStyle: 'bars',
              },
            },
            overrides: [],
          },
        });
      case 'lines_stacked':
        viz.setState({
          fieldConfig: {
            defaults: {
              custom: {
                stacking: {
                  mode: 'normal',
                  group: 'A',
                },
                fillOpacity: 35,
              },
            },
            overrides: [],
          },
        });
    }
  };

  public static Component = ({ model }: SceneComponentProps<VizOptions>) => {
    const { value } = model.useState();

    const vizOptions = [
      { label: 'Lines', value: 'lines' },
      { label: 'Bars stacked', value: 'bars_stacked' },
      { label: 'Lines stacked', value: 'lines_stacked' },
    ];

    return <RadioButtonGroup value={value} options={vizOptions} onChange={model.onChange} size="sm" />;
  };
}
