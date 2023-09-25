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
import { GraphDrawStyle, LegendDisplayMode, StackingMode, TooltipDisplayMode } from '@grafana/schema';

export function getDynamicVizOptionsTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A panel with actions that change visualization settings',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Dynamic options demo',
        $data: getQueryRunnerWithRandomWalkQuery({ seriesCount: 3, spread: 15 }, { maxDataPoints: 50 }),
        body: new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: PanelBuilders.timeseries()
                .setTitle('Graph')
                .setHeaderActions([new VizOptions({ value: 'lines' })])
                .build(),
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
  private intervalId?: NodeJS.Timer;

  public onChange = (value: string) => {
    clearInterval(this.intervalId);
    this.setState({ value });
    const viz = this.parent as VizPanel;

    switch (value) {
      case 'random_description':
        viz.onDescriptionChange(getRandomSentence());
        break;
      case 'random_title':
        viz.onTitleChange(getRandomSentence());
        this.intervalId = setInterval(() => {
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
