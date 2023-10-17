import { css, CSSObject } from '@emotion/css';
import { config } from '@grafana/runtime';
import React, { ComponentType, CSSProperties, useMemo } from 'react';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayout, SceneObjectState, SceneObject } from '../../../core/types';

interface SceneCSSGridLayoutState extends SceneObjectState, SceneCSSGridItemPlacement {
  children: Array<SceneCSSGridItem | SceneObject>;
  templateRows: CSSProperties['gridTemplateRows'];
  templateColumns: CSSProperties['gridTemplateColumns'];
  rowGap?: CSSProperties['rowGap'];
  columnGap?: CSSProperties['columnGap'];
  justifyItems?: CSSProperties['justifyItems'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];

  /**
   * True when the item should rendered but not visible.
   * Useful for conditional display of layout items
   */
  isHidden?: boolean;

  md?: SceneCSSGridLayoutState;
}

export class SceneCSSGridLayout extends SceneObjectBase<SceneCSSGridLayoutState> implements SceneLayout {
  public static Component = SceneCSSGridLayoutRenderer;

  public isDraggable(): boolean {
    return false;
  }
}

function SceneCSSGridLayoutRenderer({ model }: SceneCSSGridItemRenderProps<SceneCSSGridLayout>) {
  const { children, isHidden } = model.useState();
  const style = useLayoutStyle(model.state);

  if (isHidden) {
    return null;
  }

  return (
    <div className={style}>
      {children.map((item) => {
        const Component = item.Component as ComponentType<SceneCSSGridItemRenderProps<SceneObject>>;
        return <Component key={item.state.key} model={item} parentState={model.state} />;
      })}
    </div>
  );
}

export interface SceneCSSGridItemPlacement {
  /**
   * True when the item should rendered but not visible.
   * Useful for conditional display of layout items
   */
  isHidden?: boolean;
}

export interface SceneCSSGridItemState extends SceneCSSGridItemPlacement, SceneObjectState {
  body: SceneObject | undefined;
}

interface SceneCSSGridItemRenderProps<T> extends SceneComponentProps<T> {
  parentState?: SceneCSSGridItemPlacement;
}

export class SceneCSSGridItem extends SceneObjectBase<SceneCSSGridItemState> {
  public static Component = SceneCSSGridItemRenderer;
}

function SceneCSSGridItemRenderer({ model, parentState }: SceneCSSGridItemRenderProps<SceneCSSGridItem>) {
  if (!parentState) {
    throw new Error('SceneCSSGridItem must be a child of SceneCSSGridLayout');
  }

  const { body, isHidden } = model.useState();

  if (!body || isHidden) {
    return null;
  }

  return (
    <div className={itemContainer}>
      <body.Component model={body} />
    </div>
  );
}

const itemContainer = css({
  // Needed for VizPanel
  position: 'relative',
});

function useLayoutStyle(state: SceneCSSGridLayoutState) {
  return useMemo(() => {
    const {} = state;
    // only need breakpoints so accessing theme from config instead of context is ok
    const theme = config.theme2;

    const style: CSSObject = {};

    style.display = 'grid';
    style.gridTemplateRows = state.templateRows;
    style.gridTemplateColumns = state.templateColumns;
    style.rowGap = state.rowGap || '8px';
    style.columnGap = state.columnGap || '8px';
    style.justifyItems = state.justifyItems || 'unset';
    style.alignItems = state.alignItems || 'unset';
    style.justifyContent = state.justifyContent || 'unset';
    style.flexGrow = 1;

    style[theme.breakpoints.down('md')] = {
      gridTemplateRows: state.md?.templateRows,
      columns: state.md?.templateColumns,
      rowGap: state.md?.rowGap || '8px',
      columnGap: state.md?.columnGap || '8px',
      justifyItems: state.md?.justifyItems || 'unset',
      alignItems: state.md?.alignItems || 'unset',
      justifyContent: state.md?.justifyContent || 'unset',
    };

    return css(style);
  }, [state]);
}
