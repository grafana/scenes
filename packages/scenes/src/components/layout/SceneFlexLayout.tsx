import React, { ComponentType, CSSProperties } from 'react';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayout, SceneObjectState, SceneObject } from '../../core/types';
import { LazyLoader, Props } from './grid/LazyLoader';

export interface SceneFlexItemStateLike extends SceneFlexItemPlacement, SceneObjectState {}

export interface SceneFlexItemLike extends SceneObject<SceneFlexItemStateLike> {
  isLazy?: boolean;
}

interface SceneFlexLayoutState extends SceneObjectState, SceneFlexItemPlacement {
  direction?: CSSProperties['flexDirection'];
  wrap?: CSSProperties['flexWrap'];
  children: SceneFlexItemLike[];
  isLazy?: boolean;
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

function SceneFlexLayoutRenderer({ model, parentDirection, isLazy: parentIsLazy }: SceneFlexItemRenderProps<SceneFlexLayout>) {
  const { direction = 'row', children, wrap, isLazy: isLazy_ } = model.useState();
  const isLazy = isLazy_ || parentIsLazy;

  let style: CSSProperties = {
    display: 'flex',
    flexGrow: 1,
    flexDirection: direction,
    gap: '8px',
    flexWrap: wrap || 'nowrap',
    alignContent: 'baseline',
    minHeight: 0,
  };

  if (parentDirection) {
    style = {
      ...getFlexItemItemStyles(parentDirection || 'row', model),
      ...style,
    };
  }

  return (
      <div style={style}>
        {children.map((item) => {
          const Component = item.Component as ComponentType<SceneFlexItemRenderProps<SceneObject>>;
          return <Component key={item.state.key} model={item} parentDirection={direction} isLazy={isLazy} />;
        })}
      </div>
  );
}

interface SceneFlexItemPlacement {
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

interface SceneFlexItemState extends SceneFlexItemPlacement, SceneObjectState {
  body: SceneObject | undefined;
}

interface SceneFlexItemRenderProps<T> extends SceneComponentProps<T> {
  parentDirection?: CSSProperties['flexDirection'];
  isLazy?: boolean;
}

export class SceneFlexItem extends SceneObjectBase<SceneFlexItemState> {
  public static Component = SceneFlexItemRenderer;
}

function SceneFlexItemRenderer({ model, parentDirection, isLazy }: SceneFlexItemRenderProps<SceneFlexItem>) {
  const { body } = model.useState();
  let style: CSSProperties = {};

  if (!parentDirection) {
    throw new Error('SceneFlexItem must be a child of SceneFlexLayout');
  }

  style = getFlexItemItemStyles(parentDirection, model);
  const LazyWrapper = isLazy ? LazyLoader : ({ style, children }: Props) => <div style={style}>{children}</div>;
  if (!body) {
    return null;
  }

  return (
    <LazyWrapper style={style}>
      <body.Component model={body} />
    </LazyWrapper>
  );
}

function getFlexItemItemStyles(direction: CSSProperties['flexDirection'], item: SceneFlexItemLike) {
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
