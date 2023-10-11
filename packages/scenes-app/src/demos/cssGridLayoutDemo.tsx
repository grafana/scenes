import React from 'react';

import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridLayout,
  SceneComponentProps,
  SceneFlexItem,
  SceneObjectBase,
  SceneObjectState,
  SceneToolbarInput,
} from '@grafana/scenes';
import { Select } from '@grafana/ui';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import { ControlsLabel } from '@grafana/scenes/src/utils/ControlsLabel';

export function getCssGridLayoutDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A CSS Grid Layout demo',
    getScene: () => {
      const layout = new SceneCSSGridLayout({
        children: getLayoutChildren(10),
        columns: columnTemplateOptions[0],
        rows: 'auto',
        rowGap: '8px',
      });

      const inputControl = new SceneToolbarInput({
        label: 'Panel count',
        value: '10',
        onChange: (newCount) => {
          layout.setState({ children: getLayoutChildren(newCount) });
        },
      });

      const templateSelector = new TemplateSelector({
        value: '1fr auto 1fr',
        onChange: (template) => layout.setState({ columns: template }),
      });

      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        controls: [inputControl, templateSelector],
        body: layout,
      });
    },
  });
}

function getLayoutChildren(count: number) {
  return Array.from(
    Array(count),
    (v, index) =>
      new SceneFlexItem({
        minWidth: 300,
        minHeight: 300,
        body: PanelBuilders.timeseries()
          .setTitle(`Panel ${count}`)
          .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 400 }))
          .build(),
      })
  );
}

const columnTemplateOptions = ['2fr 1fr auto', '1fr auto', 'auto', '3fr 2fr 1fr'];

export interface TemplateSelectorState extends SceneObjectState {
  value: string;
  onChange: (template: string) => void;
}

export class TemplateSelector extends SceneObjectBase<TemplateSelectorState> {
  public static Component = ({ model }: SceneComponentProps<TemplateSelector>) => {
    const { value, onChange } = model.useState();

    const options = columnTemplateOptions.map((t) => ({ label: t, value: t }));
    const optionValue = options.find((x) => x.value === value) ?? options[0];

    return (
      <div style={{ display: 'flex' }}>
        <ControlsLabel label="Column template" />
        <Select value={optionValue} options={options} onChange={(v) => onChange(v.value!)} />
      </div>
    );
  };
}
