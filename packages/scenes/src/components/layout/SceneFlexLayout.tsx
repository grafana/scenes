import React, { CSSProperties } from 'react';

import { Field, RadioButtonGroup } from '@grafana/ui';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  SceneComponentProps,
  SceneLayoutChildOptions,
  SceneLayout,
  SceneObjectStatePlain,
  SceneObject,
} from '../../core/types';

export type FlexLayoutDirection = 'column' | 'row';

export interface SceneFlexLayoutState extends SceneObjectStatePlain {
  direction?: FlexLayoutDirection;
  wrap?: CSSProperties['flexWrap'];
  children: SceneFlexLayoutChild[];
}

export class SceneFlexLayout extends SceneObjectBase<SceneFlexLayoutState> implements SceneLayout {
  public static Component = FlexLayoutRenderer;

  public toggleDirection() {
    this.setState({
      direction: this.state.direction === 'row' ? 'column' : 'row',
    });
  }

  public isDraggable(): boolean {
    return false;
  }
}

function FlexLayoutRenderer({ model, isEditing }: SceneComponentProps<SceneFlexLayout>) {
  const { direction = 'row', children, wrap } = model.useState();
  const style: CSSProperties = {
    flexGrow: 1,
    flexDirection: direction,
    display: 'flex',
    gap: '8px',
    flexWrap: wrap,
    alignContent: 'baseline',
    minHeight: 0,
  };

  return (
    <div style={style}>
      {children.map((item) => (
        <item.Component key={item.state.key} model={item} isEditing={isEditing} />
      ))}
    </div>
  );
}

export interface SceneFlexLayoutChildState extends SceneObjectStatePlain {
  width?: number | string;
  height?: number | string;
  xSizing?: 'fill' | 'content';
  ySizing?: 'fill' | 'content';
  minWidth?: number | string;
  minHeight?: number | string;
  isDraggable?: boolean;
  isResizable?: boolean;
  body: SceneObject;
}

export class SceneFlexLayoutChild extends SceneObjectBase<SceneFlexLayoutChildState> {
  public static Component = SceneFlexLayoutChildRenderer;
}

function SceneFlexLayoutChildRenderer({ model, isEditing }: SceneComponentProps<SceneFlexLayoutChild>) {
  const state = model.useState();
  const { direction = 'row' } = (model.parent as SceneFlexLayout).useState();

  return (
    <div style={getItemStyles(direction, state)}>
      <model.Component model={model} isEditing={isEditing} />
    </div>
  );
}

function getItemStyles(direction: FlexLayoutDirection, layout: SceneLayoutChildOptions = {}) {
  const { xSizing = 'fill', ySizing = 'fill' } = layout;

  const style: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    minWidth: layout.minWidth,
    minHeight: layout.minHeight,
    position: 'relative',
  };

  if (direction === 'column') {
    if (layout.height) {
      style.height = layout.height;
    } else {
      style.flexGrow = ySizing === 'fill' ? 1 : 0;
    }

    if (layout.width) {
      style.width = layout.width;
    } else {
      style.alignSelf = xSizing === 'fill' ? 'stretch' : 'flex-start';
    }
  } else {
    if (layout.height) {
      style.height = layout.height;
    } else {
      style.alignSelf = ySizing === 'fill' ? 'stretch' : 'flex-start';
    }

    if (layout.width) {
      style.width = layout.width;
    } else {
      style.flexGrow = xSizing === 'fill' ? 1 : 0;
    }
  }

  return style;
}
