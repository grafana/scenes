import { css, CSSObject } from '@emotion/css';
import { config } from '@grafana/runtime';
import { ComponentType, CSSProperties, useMemo } from 'react';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayout, SceneObjectState, SceneObject } from '../../core/types';

export interface SceneFlexItemStateLike extends SceneFlexItemPlacement, SceneObjectState {}

export interface SceneFlexItemLike extends SceneObject<SceneFlexItemStateLike> {}

interface SceneFlexLayoutState extends SceneObjectState, SceneFlexItemPlacement {
  children: SceneFlexItemLike[];
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

function SceneFlexLayoutRenderer({ model, parentState }: SceneFlexItemRenderProps<SceneFlexLayout>) {
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

export interface SceneFlexItemPlacement {
  wrap?: CSSProperties['flexWrap'];
  direction?: CSSProperties['flexDirection'];
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

  /**
   * Set direction for smaller screens. This defaults to column.
   * This equals media query theme.breakpoints.down('md')
   */
  md?: SceneFlexItemPlacement;
}

export interface SceneFlexItemState extends SceneFlexItemPlacement, SceneObjectState {
  body: SceneObject | undefined;
}

interface SceneFlexItemRenderProps<T> extends SceneComponentProps<T> {
  parentState?: SceneFlexItemPlacement;
}

export class SceneFlexItem extends SceneObjectBase<SceneFlexItemState> {
  public static Component = SceneFlexItemRenderer;
}

function SceneFlexItemRenderer({ model, parentState }: SceneFlexItemRenderProps<SceneFlexItem>) {
  if (!parentState) {
    throw new Error('SceneFlexItem must be a child of SceneFlexLayout');
  }

  const { body, isHidden } = model.useState();
  const style = useLayoutItemStyle(model.state, parentState);

  if (!body || isHidden) {
    return null;
  }

  return (
    <div className={style}>
      <body.Component model={body} />
    </div>
  );
}
function applyItemStyles(style: CSSObject, state: SceneFlexItemPlacement, parentState: SceneFlexItemPlacement) {
  const parentDirection = parentState.direction ?? 'row';
  const { xSizing = 'fill', ySizing = 'fill' } = state;

  style.display = 'flex';
  style.position = 'relative';
  style.flexDirection = parentDirection;

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

    if (state.wrap) {
      style.flexWrap = state.wrap;
      if (state.wrap !== 'nowrap') {
        if (parentDirection === 'row') {
          style.rowGap = '8px';
        } else {
          style.columnGap = '8px';
        }
      }
    }
  }

  style.minWidth = state.minWidth;
  style.maxWidth = state.maxWidth;
  style.maxHeight = state.maxHeight;

  // For responsive layouts to work we default use the minHeight or height of the parent
  style.minHeight = state.minHeight ?? parentState.minHeight;
  style.height = state.height ?? parentState.height;

  return style;
}

function useLayoutItemStyle(state: SceneFlexItemState, parentState: SceneFlexItemPlacement) {
  return useMemo(() => {
    const theme = config.theme2;
    const style = applyItemStyles({}, state, parentState);

    // Unset maxWidth for small screens by default
    style[theme.breakpoints.down('md')] = {
      maxWidth: state.md?.maxWidth ?? 'unset',
      maxHeight: state.md?.maxHeight ?? 'unset',
      height: state.md?.height ?? parentState.md?.height,
      width: state.md?.width ?? parentState.md?.width,
    };

    return css(style);
  }, [state, parentState]);
}

function useLayoutStyle(state: SceneFlexLayoutState, parentState?: SceneFlexItemPlacement) {
  return useMemo(() => {
    const { direction = 'row', wrap } = state;
    // only need breakpoints so accessing theme from config instead of context is ok
    const theme = config.theme2;

    const style: CSSObject = {};

    if (parentState) {
      applyItemStyles(style, state, parentState);
    } else {
      style.display = 'flex';
      style.flexGrow = 1;
      style.minWidth = state.minWidth;
      style.minHeight = state.minHeight;
    }

    style.flexDirection = direction;
    style.gap = '8px';
    style.flexWrap = wrap || 'nowrap';
    style.alignContent = 'baseline';
    style.minWidth = style.minWidth || 0;
    style.minHeight = style.minHeight || 0;

    style[theme.breakpoints.down('md')] = {
      flexDirection: state.md?.direction ?? 'column',
      maxWidth: state.md?.maxWidth ?? 'unset',
      maxHeight: state.md?.maxHeight ?? 'unset',
      height: state.md?.height ?? 'unset',
      width: state.md?.width ?? 'unset',
    };

    return css(style);
  }, [parentState, state]);
}
