import React from 'react';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Input } from '@grafana/ui';

export interface CustomSceneObjectState extends SceneObjectState {
  value?: string;
  onChange: (value: number) => void;
}

export class CustomSceneObject extends SceneObjectBase<CustomSceneObjectState> {
  public static Component = ({ model }: SceneComponentProps<CustomSceneObject>) => {
    const state = model.useState();

    return (
      <Input
        prefix="Series count"
        defaultValue={state.value}
        width={20}
        type="number"
        onBlur={(evt) => {
          model.state.onChange(parseInt(evt.currentTarget.value, 10));
        }}
      />
    );
  };
}
