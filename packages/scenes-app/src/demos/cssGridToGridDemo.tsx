import React from 'react';

import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SplitLayout,
  DragManager,
} from '@grafana/scenes';
import { Select } from '@grafana/ui';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { ControlsLabel } from '@grafana/scenes/src/utils/ControlsLabel';
import { SelectableValue } from '@grafana/data';

const columnTemplateOptions = ['repeat(auto-fit, minmax(400px, 1fr))', 'repeat(3, 1fr)', '2fr 1fr 1fr', 'auto'];
const rowTemplateOptions = ['unset', 'auto', '350px repeat(4, 150px)', 'repeat(4, 1fr)', '100%'];
const autoRowOptions = ['150px', '250px', 'auto'];

export function getCssGridToGridDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle:
      'A CSS Grid Layout demo, isLazy is enabled to showcase lazy rendering of panels. Every 3rd panel is hidden to test the layout working properly.',
    getScene: () => {
      const layout = new SplitLayout({
        primary: new SplitLayout({
          primary: new SceneCSSGridLayout({
            children: getLayoutChildren(2, false),
            templateColumns: columnTemplateOptions[0],
            templateRows: rowTemplateOptions[0],
            autoRows: autoRowOptions[2],
            rowGap: 1,
            isLazy: true,
          }) as any,
          secondary: new SceneCSSGridLayout({
            children: getLayoutChildren(2, false),
            templateColumns: columnTemplateOptions[0],
            templateRows: rowTemplateOptions[0],
            autoRows: autoRowOptions[2],
            rowGap: 1,
            isLazy: true,
          }) as any,
          direction: 'row',
        }),
        secondary: new SceneCSSGridLayout({
          children: getLayoutChildren(2, false),
          templateColumns: columnTemplateOptions[0],
          templateRows: rowTemplateOptions[0],
          autoRows: autoRowOptions[2],
          rowGap: 1,
          isLazy: true,
        }) as any,
        direction: 'column',
      });

      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: layout,
        $behaviors: [new DragManager({})],
      });
    },
  });
}

function getLayoutChildren(count: number, includeHidden = true) {
  return Array.from(
    Array(count),
    (v, index) =>
      new SceneCSSGridItem({
        body: PanelBuilders.stat()
          .setTitle(`Panel ${index + 1}`)
          .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 400 }))
          .build(),
        isHidden: includeHidden && index % 3 === 0,
      })
  );
}

export interface TemplateSelectorState extends SceneObjectState {
  label: string;
  value: string;
  onChange: (template: string) => void;
  options: string[];
}

export class TemplateSelector extends SceneObjectBase<TemplateSelectorState> {
  public onChange = (v: SelectableValue<string>) => {
    this.setState({ value: v.value! });
    this.state.onChange(v.value!);
  };

  public static Component = ({ model }: SceneComponentProps<TemplateSelector>) => {
    const { value, options, label } = model.useState();

    const opts = options.map((t) => ({ label: t, value: t }));
    const optionValue = opts.find((x) => x.value === value) ?? options[0];

    return (
      <div style={{ display: 'flex' }}>
        <ControlsLabel label={label} />
        <Select value={optionValue} options={opts} onChange={model.onChange} />
      </div>
    );
  };
}
