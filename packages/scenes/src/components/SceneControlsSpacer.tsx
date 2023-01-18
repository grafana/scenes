import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps } from '../core/types';

export class SceneControlsSpacer extends SceneObjectBase<{}> {
  public constructor() {
    super({});
  }

  public static Component = (_props: SceneComponentProps<SceneControlsSpacer>) => {
    return <div style={{ flexGrow: 1 }} />;
  };
}
