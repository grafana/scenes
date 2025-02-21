import React from 'react';
import {
  EmbeddedScene,
  FieldConfigBuilders,
  PanelBuilders,
  PanelOptionsBuilders,
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
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { GraphDrawStyle, LegendDisplayMode, StackingMode, TooltipDisplayMode, VizOrientation } from '@grafana/schema';

export function getDynamicVizOptionsTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Dynamic options demo',
        $data: getQueryRunnerWithRandomWalkQuery({ seriesCount: 3, spread: 15 }, { maxDataPoints: 50 }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: PanelBuilders.timeseries()
                .setTitle('Graph')
                .setHeaderActions([new VizOptions({ value: 'lines' })])
                .build(),
            }),
            new SceneFlexItem({
              body: PanelBuilders.timeseries()
                .setTitle('Graph')
                .setHeaderActions([new VizChange({ value: 'timeseries' })])
                .build(),
            }),
          ],
        }),
      });
    },
  });
}

interface VizChangeState extends SceneObjectState {
  value: string;
}

class VizChange extends SceneObjectBase<VizChangeState> {
  public onChange = (value: string) => {
    this.setState({ value });
    const viz = this.parent as VizPanel;

    if (value === 'timeseries') {
      viz.changePluginType('timeseries');
    } else if (value === 'stat') {
      viz.changePluginType('stat');
    } else if (value === 'gauge_extra') {
      const options = PanelOptionsBuilders.gauge().setOption('orientation', VizOrientation.Vertical).build();

      const fieldConfig = FieldConfigBuilders.gauge().setUnit('accMS2').build();

      viz.changePluginType('gauge', options, fieldConfig);
    }
  };

  public static Component = ({ model }: SceneComponentProps<VizOptions>) => {
    const { value } = model.useState();

    const vizOptions = [
      { label: 'Timeseries panel', value: 'timeseries' },
      { label: 'Stat', value: 'stat' },
      { label: 'Gauge with extra config', value: 'gauge_extra' },
    ];

    return (
      <>
        <RadioButtonGroup value={value} options={vizOptions} onChange={model.onChange} size="sm" />
      </>
    );
  };
}

interface VizOptionsState extends SceneObjectState {
  value: string;
}

class VizOptions extends SceneObjectBase<VizOptionsState> {
  private intervalId?: number;

  public onChange = (value: string) => {
    window.clearInterval(this.intervalId);
    this.setState({ value });
    const viz = this.parent as VizPanel;

    switch (value) {
      case 'random_description':
        viz.onDescriptionChange(getRandomSentence());
        break;
      case 'random_title':
        viz.onTitleChange(getRandomSentence());
        this.intervalId = window.setInterval(() => {
          viz.onTitleChange(getRandomSentence());
        }, 2000);
        break;
      case 'lines':
        viz.onFieldConfigChange(FieldConfigBuilders.timeseries().build(), true);
        viz.onOptionsChange(PanelOptionsBuilders.timeseries().build(), true);
        break;
      case 'bars_stacked':
        viz.onFieldConfigChange(
          FieldConfigBuilders.timeseries()
            .setCustomFieldConfig('fillOpacity', 35)
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
            .setCustomFieldConfig('stacking', {
              mode: StackingMode.Normal,
              group: 'A',
            })
            .build()
        );
        viz.onOptionsChange(
          PanelOptionsBuilders.timeseries()
            .setOption('legend', {
              displayMode: LegendDisplayMode.Table,
            })
            .build()
        );
        break;
      case 'lines_stacked':
        viz.onFieldConfigChange(
          FieldConfigBuilders.timeseries()
            .setCustomFieldConfig('fillOpacity', 10)
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
            .setCustomFieldConfig('stacking', {
              mode: StackingMode.Normal,
              group: 'A',
            })
            .build()
        );
        viz.onOptionsChange(
          PanelOptionsBuilders.timeseries()
            .setOption('tooltip', {
              mode: TooltipDisplayMode.Multi,
            })
            .build(),
          true
        );
        break;
    }
  };

  public static Component = ({ model }: SceneComponentProps<VizOptions>) => {
    const { value } = model.useState();

    const vizOptions = [
      { label: 'Default config', value: 'lines' },
      { label: 'Bars stacked & table legend', value: 'bars_stacked' },
      { label: 'Lines stacked & tooltip multi', value: 'lines_stacked' },
      { label: 'Random title (every 2 sec)', value: 'random_title' },
      { label: 'Random description', value: 'random_description' },
    ];

    return (
      <>
        <RadioButtonGroup value={value} options={vizOptions} onChange={model.onChange} size="sm" />
      </>
    );
  };
}

function getRandomSentence(): string {
  const subjects = ['I', 'You', 'We', 'They'];
  const verbs = ['run', 'eat', 'sleep', 'dance', 'sing'];
  const objects = ['apples', 'bananas', 'books', 'cats', 'dogs'];

  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
  const randomObject = objects[Math.floor(Math.random() * objects.length)];

  return `${randomSubject} ${randomVerb} ${randomObject}.`;
}
