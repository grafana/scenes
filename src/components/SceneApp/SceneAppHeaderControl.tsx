import React from 'react';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectStatePlain } from '../../core/types';
import { ItemWithLabel } from '../ItemWithLabel';

export interface SceneAppPageCustomControlState extends SceneObjectStatePlain {
  label?: string;
  separator?: boolean;
  value: React.ReactNode;
}

export class SceneAppPageCustomControl extends SceneObjectBase<SceneAppPageCustomControlState> {
  public static Component = SceneTimePickerRenderer;
}

function SceneTimePickerRenderer({ model }: SceneComponentProps<SceneAppPageCustomControl>) {
  const { label, value, separator } = model.useState();

  return (
    <ItemWithLabel label={label} separator={separator}>
      {value}
    </ItemWithLabel>
  );
}
