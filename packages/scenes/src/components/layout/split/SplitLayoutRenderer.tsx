import React, { ComponentType } from 'react';

import { SceneComponentProps, SceneObjectState, SceneObject } from '../../../core/types';
import { SceneFlexItemPlacement } from '../SceneFlexLayout';
import { SplitLayout } from './SplitLayout';
import { Splitter } from './Splitter';

export function SplitLayoutRenderer({ model }: SceneFlexItemRenderProps<SplitLayout>) {
  const { primary, secondary, direction, isHidden, initialSize } = model.useState();

  if (isHidden) {
    return null;
  }

  const Prim = primary.Component as ComponentType<SceneFlexItemRenderProps<SceneObject>>;
  const Sec = secondary.Component as ComponentType<SceneFlexItemRenderProps<SceneObject>>;
  return (
    <Splitter direction={direction} initialSize={initialSize ?? 0.5}>
      <Prim key={primary.state.key} model={primary} parentState={model.state} />
      <Sec key={secondary.state.key} model={secondary} parentState={model.state} />
    </Splitter>
  );
}

export interface SceneFlexItemState extends SceneFlexItemPlacement, SceneObjectState {
  body: SceneObject | undefined;
}

interface SceneFlexItemRenderProps<T> extends SceneComponentProps<T> {
  parentState?: SceneFlexItemPlacement;
}
