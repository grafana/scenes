import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps } from '../core/types';

export class SceneControlsSpacer extends SceneObjectBase {
  public constructor() {
    super({});
  }

  public get Component() {
    // Skipping wrapper component for this scene object so that it renders right away
    return SceneControlsSpacer.Component;
  }

  public static Component = (_props: SceneComponentProps<SceneControlsSpacer>) => {
    return <div style={{ flexGrow: 1 }} />;
  };
}
