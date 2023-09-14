import React, { ComponentType } from 'react';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState, SceneObject } from '../../core/types';
import { IconName, NavModelItem } from '@grafana/data';
import { Tab } from '@grafana/ui';

export interface SceneTabLayoutState extends SceneObjectState {
  children: SceneObject[];
}

export class SceneTabLayout extends SceneObjectBase<SceneTabLayoutState> {
  public static Component = SceneTabLayoutRenderer;
}

function SceneTabLayoutRenderer({ model }: SceneComponentProps<SceneTabLayout>) {
  const { children, isHidden } = model.useState();
  const style = useLayoutStyle(model.state, parentState);

  if (isHidden) {
    return null;
  }

  return (
    <div className={style}>
      {children.map((item) => {
        const Component = item.Component as ComponentType<SceneFlexItemRenderProps<SceneObject>>;
        return <Component key={item.state.key} model={item} parentState={model.state} />;
      })}
    </div>
  );
}

export interface SceneTabLayoutItemState extends SceneObjectState {
  label: string;
  icon?: IconName;
  value?: string;
  /** A number rendered next to the text. Usually used to display the number of items in a tab's view. */
  counter?: number | null;
  /** Extra content, displayed after the tab label and counter */
  suffix?: NavModelItem['tabSuffix'];
  body: SceneObject;
}

export class SceneTabLayoutItem extends SceneObjectBase<SceneTabLayoutItemState> {
  public static Component = ({ model }: SceneComponentProps<SceneTabLayoutItem>) => {
    const state = model.useState();

    return <Tab label={state.label} icon={state.icon} />;
  };
}
