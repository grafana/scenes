import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps } from '../core/types';

export class SceneControlsSpacer extends SceneObjectBase {
  // This component can render right away, it fixes flickering movement of controls
  static UNSAFE_renderBeforeActive = true;

  public constructor() {
    super({});
  }

  public static Component = (_props: SceneComponentProps<SceneControlsSpacer>) => {
    return <div style={{ flexGrow: 1 }} />;
  };
}
