import { ComponentType } from 'react';

import { SceneComponentProps, SceneObjectState, SceneObject } from '../../../core/types';
import { SceneFlexItemPlacement } from '../SceneFlexLayout';
import { SplitLayout } from './SplitLayout';
import { Splitter } from './Splitter';

export function SplitLayoutRenderer({ model }: SceneFlexItemRenderProps<SplitLayout>) {
  const { primary, secondary, direction, isHidden, initialSize, primaryPaneStyles, secondaryPaneStyles } =
    model.useState();

  if (isHidden) {
    return null;
  }

  const Prim = primary.Component as ComponentType<SceneFlexItemRenderProps<SceneObject>>;
  const Sec = secondary?.Component as ComponentType<SceneFlexItemRenderProps<SceneObject>>;
  let startSize = secondary ? initialSize : 1;

  return (
    <Splitter
      direction={direction}
      initialSize={startSize ?? 0.5}
      primaryPaneStyles={primaryPaneStyles}
      secondaryPaneStyles={secondaryPaneStyles}
    >
      <Prim key={primary.state.key} model={primary} parentState={model.state} />
      {Sec && secondary && <Sec key={secondary.state.key} model={secondary} parentState={model.state} />}
    </Splitter>
  );
}

export interface SceneFlexItemState extends SceneFlexItemPlacement, SceneObjectState {
  body: SceneObject | undefined;
}

interface SceneFlexItemRenderProps<T> extends SceneComponentProps<T> {
  parentState?: SceneFlexItemPlacement;
}
