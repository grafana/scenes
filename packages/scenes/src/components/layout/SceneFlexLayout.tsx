import { css, CSSObject } from '@emotion/css';
import { config } from '@grafana/runtime';
import React, { ComponentType, CSSProperties, useMemo } from 'react';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayout, SceneObjectState, SceneObject } from '../../core/types';

export interface SceneFlexItemStateLike extends SceneFlexItemPlacement, SceneObjectState {}

export interface SceneFlexItemLike extends SceneObject<SceneFlexItemStateLike> {}

interface SceneFlexLayoutState extends SceneObjectState, SceneFlexItemPlacement {
  direction?: CSSProperties['flexDirection'];
  wrap?: CSSProperties['flexWrap'];
  children: SceneFlexItemLike[];
  breakpointSM?: {
    direction?: CSSProperties['flexDirection'];
  };
  breakpointMD?: {
    direction?: CSSProperties['flexDirection'];
  };
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

function SceneFlexLayoutRenderer({ model, parentDirection }: SceneFlexItemRenderProps<SceneFlexLayout>) {
  const { direction = 'row', children, isHidden } = model.useState();
  const style = useLayoutStyle(model.state, parentDirection);

  if (isHidden) {
    return null;
  }

  return (
    <div className={style}>
      {children.map((item) => {
        const Component = item.Component as ComponentType<SceneFlexItemRenderProps<SceneObject>>;
        return <Component key={item.state.key} model={item} parentDirection={direction} />;
      })}
    </div>
  );
}

export interface SceneFlexItemPlacement {
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
  /**
   * True when the item should rendered but not visible.
   * Useful for conditional display of layout items
   */
  isHidden?: boolean;
}

interface SceneFlexItemState extends SceneFlexItemPlacement, SceneObjectState {
  body: SceneObject | undefined;
  isHidden?: boolean;
}

interface SceneFlexItemRenderProps<T> extends SceneComponentProps<T> {
  parentDirection?: CSSProperties['flexDirection'];
}

export class SceneFlexItem extends SceneObjectBase<SceneFlexItemState> {
  public static Component = SceneFlexItemRenderer;
}

function SceneFlexItemRenderer({ model, parentDirection }: SceneFlexItemRenderProps<SceneFlexItem>) {
  if (!parentDirection) {
    throw new Error('SceneFlexItem must be a child of SceneFlexLayout');
  }

  const { body, isHidden } = model.useState();
  const style = useLayoutItemStyle(model.state, parentDirection);

  if (!body || isHidden) {
    return null;
  }

  return (
    <div className={style}>
      <body.Component model={body} />
    </div>
  );
}
function applyItemStyles(
  style: CSSObject,
  state: SceneFlexItemPlacement,
  parentDirection: CSSProperties['flexDirection']
) {
  const { xSizing = 'fill', ySizing = 'fill' } = state;

  style.display = 'flex';
  style.position = 'relative';
  style.flexDirection = parentDirection;
  style.minWidth = state.minWidth;
  style.minHeight = state.minHeight;
  style.maxWidth = state.maxWidth;
  style.maxHeight = state.maxHeight;

  if (parentDirection === 'column') {
    if (state.height) {
      style.height = state.height;
    } else {
      style.flexGrow = ySizing === 'fill' ? 1 : 0;
    }

    if (state.width) {
      style.width = state.width;
    } else {
      style.alignSelf = xSizing === 'fill' ? 'stretch' : 'flex-start';
    }
  } else {
    if (state.height) {
      style.height = state.height;
    } else {
      style.alignSelf = ySizing === 'fill' ? 'stretch' : 'flex-start';
    }

    if (state.width) {
      style.width = state.width;
    } else {
      style.flexGrow = xSizing === 'fill' ? 1 : 0;
    }
  }

  return style;
}

function useLayoutItemStyle(state: SceneFlexItemPlacement, parentDirection: CSSProperties['flexDirection']) {
  return useMemo(() => {
    return css(applyItemStyles({}, state, parentDirection));
  }, [state, parentDirection]);
}

function useLayoutStyle(state: SceneFlexLayoutState, parentDirection?: CSSProperties['flexDirection']) {
  return useMemo(() => {
    const { direction = 'row', wrap } = state;
    // only need breakpoints so accessing theme from config instead of context is ok
    const theme = config.theme2;

    let style: CSSObject = {};

    if (parentDirection) {
      applyItemStyles(style, state, parentDirection);
    }

    //style.flexGrow = 1;
    style.display = 'flex';
    style.flexDirection = direction;
    style.gap = '8px';
    style.flexGrow = 1;
    style.flexWrap = wrap || 'nowrap';
    style.alignContent = 'baseline';
    style.minHeight = 0;
    style[theme.breakpoints.down('md')] = {
      flexDirection: state.breakpointMD?.direction ?? 'column',
    };

    return css(style);
  }, [parentDirection, state]);
}
