import React, { CSSProperties } from 'react';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  SceneComponentProps,
  SceneLayout,
  SceneObjectState,
  SceneObject,
  SceneLayoutItemState,
} from '../../core/types';

export interface SceneFlexItemLike extends SceneObject<SceneFlexItemState> {}

interface SceneFlexLayoutState extends SceneObjectState {
  direction?: CSSProperties['flexDirection'];
  wrap?: CSSProperties['flexWrap'];
  children: Array<SceneFlexItemLike | SceneFlexLayout>;
}

export class SceneFlexLayout extends SceneObjectBase<SceneFlexLayoutState> implements SceneLayout {
  public static Component = SceneFlexLayoutRenderer;

  public toggleDirection() {
    this.setState({
      direction: this.state.direction === 'row' ? 'column' : 'row',
    });
  }

  public isDraggable(): boolean {
    return false;
  }
}

function SceneFlexLayoutRenderer({ model }: SceneComponentProps<SceneFlexLayout>) {
  const { direction = 'row', children, wrap } = model.useState();
  const style: CSSProperties = {
    display: 'flex',
    flexGrow: 1,
    flexDirection: direction,
    gap: '8px',
    flexWrap: wrap || 'nowrap',
    alignContent: 'baseline',
    minHeight: 0,
  };

  return (
    <div style={style}>
      {children.map((item) => {
        if (isSceneFlexLayout(item)) {
          return <item.Component key={item.state.key} model={item} />;
        }
        return <item.Component key={item.state.key} model={item} />;
      })}
    </div>
  );
}

interface SceneFlexItemState extends SceneLayoutItemState {
  flexGrow?: CSSProperties['flexGrow'];
  alignSelf?: CSSProperties['alignSelf'];
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  minWidth?: CSSProperties['minWidth'];
  minHeight?: CSSProperties['minHeight'];
  maxWidth?: CSSProperties['maxWidth'];
  maxHeight?: CSSProperties['maxHeight'];
  xSizing?: 'fill' | 'content';
  ySizing?: 'fill' | 'content';
}

export class SceneFlexItem extends SceneObjectBase<SceneFlexItemState> {
  public static Component = SceneFlexItemRenderer;
}

function SceneFlexItemRenderer({ model }: SceneComponentProps<SceneFlexItem>) {
  const { body } = model.useState();
  const parent = model.parent;
  let style: CSSProperties = {};

  if (parent && isSceneFlexLayout(parent)) {
    style = getFlexItemItemStyles(parent.state.direction || 'row', model);
  } else {
    throw new Error('SceneFlexItem must be a child of SceneFlexLayout');
  }

  if (!body) {
    return null;
  }

  return (
    <div style={style}>
      <body.Component model={body} />
    </div>
  );
}
function getFlexItemItemStyles(direction: CSSProperties['flexDirection'], item: SceneFlexItem) {
  const { xSizing = 'fill', ySizing = 'fill' } = item.state;

  const style: CSSProperties = {
    display: 'flex',
    position: 'relative',
    flexDirection: direction,
    minWidth: item.state.minWidth,
    minHeight: item.state.minHeight,
    maxWidth: item.state.maxWidth,
    maxHeight: item.state.maxHeight,
  };

  if (direction === 'column') {
    if (item.state.height) {
      style.height = item.state.height;
    } else {
      style.flexGrow = ySizing === 'fill' ? 1 : 0;
    }

    if (item.state.width) {
      style.width = item.state.width;
    } else {
      style.alignSelf = xSizing === 'fill' ? 'stretch' : 'flex-start';
    }
  } else {
    if (item.state.height) {
      style.height = item.state.height;
    } else {
      style.alignSelf = ySizing === 'fill' ? 'stretch' : 'flex-start';
    }

    if (item.state.width) {
      style.width = item.state.width;
    } else {
      style.flexGrow = xSizing === 'fill' ? 1 : 0;
    }
  }

  return style;
}

function isSceneFlexLayout(model: SceneObject): model is SceneFlexLayout {
  return model instanceof SceneFlexLayout;
}
