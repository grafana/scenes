import React from 'react';

import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridLayout,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneToolbarInput,
} from '@grafana/scenes';
import { Select } from '@grafana/ui';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { ControlsLabel } from '@grafana/scenes/src/utils/ControlsLabel';
import { SelectableValue } from '@grafana/data';

const columnTemplateOptions = ['repeat(auto-fit, minmax(400px, 1fr))', 'repeat(3, 1fr)', '2fr 1fr 1fr', 'auto'];
const rowTemplateOptions = ['unset', 'auto', '350px repeat(4, 150px)', 'repeat(4, 1fr)', '100%'];
const autoRowOptions = ['150px', '250px', 'auto'];

export function getCssGridLayoutDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A CSS Grid Layout demo, isLazy is enabled to showcase lazy rendering of panels',
    getScene: () => {
      const layout = new SceneCSSGridLayout({
        children: getLayoutChildren(10),
        templateColumns: columnTemplateOptions[0],
        templateRows: rowTemplateOptions[0],
        autoRows: autoRowOptions[0],
        rowGap: 2,
        isLazy: true,
      });

      const inputControl = new SceneToolbarInput({
        label: 'Panel count',
        value: '10',
        onChange: (newCount) => {
          layout.setState({ children: getLayoutChildren(newCount) });
        },
      });

      const columnSelector = new TemplateSelector({
        label: 'Column template',
        value: columnTemplateOptions[0],
        options: columnTemplateOptions,
        onChange: (template) => layout.setState({ templateColumns: template }),
      });

      const rowSelector = new TemplateSelector({
        label: 'Row template',
        value: rowTemplateOptions[0],
        options: rowTemplateOptions,
        onChange: (template) => layout.setState({ templateRows: template }),
      });

      const autoRowsSelector = new TemplateSelector({
        label: 'Auto rows',
        value: autoRowOptions[0],
        options: autoRowOptions,
        onChange: (template) => layout.setState({ autoRows: template }),
      });

      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        controls: [inputControl, columnSelector, rowSelector, autoRowsSelector],
        body: layout,
      });
    },
  });
}

function getLayoutChildren(count: number) {
  return Array.from(Array(count), (v, index) =>
    PanelBuilders.stat()
      .setTitle(`Panel ${count}`)
      .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 400 }))
      .build()
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
