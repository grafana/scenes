import { css, CSSObject } from '@emotion/css';
import React, { ComponentType, CSSProperties, useMemo } from 'react';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayout, SceneObjectState, SceneObject } from '../../../core/types';
import { config } from '@grafana/runtime';

interface SceneCSSGridLayoutState extends SceneObjectState, SceneCSSGridItemPlacement {
  children: Array<SceneCSSGridItem | SceneObject>;
  /**
   * Useful for setting a height on items without specifying how many rows there will be.
   */
  autoRows?: CSSProperties['gridAutoRows'];
  templateRows?: CSSProperties['gridTemplateRows'];
  /**
   * Defaults to repeat(auto-fit, minmax(400px, 1fr)). This pattern us useful for equally sized items with a min width of 400px
   * and dynamic max width split equally among columns.
   */
  templateColumns: CSSProperties['gridTemplateColumns'];
  /** In Grafana design system grid units (8px)  */
  rowGap: number;
  /** In Grafana design system grid units (8px)  */
  columnGap: number;
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

  public constructor(state: Partial<SceneCSSGridLayoutState>) {
    super({
      rowGap: 1,
      columnGap: 1,
      templateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      children: state.children ?? [],
      ...state,
    });
  }

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
    const style: CSSObject = {};
    const theme = config.theme2;

    style.display = 'grid';
    style.gridTemplateColumns = state.templateColumns;
    style.gridTemplateRows = state.templateRows || 'unset';
    style.gridAutoRows = state.autoRows || 'unset';
    style.rowGap = theme.spacing(state.rowGap ?? 1);
    style.columnGap = theme.spacing(state.columnGap ?? 1);
    style.justifyItems = state.justifyItems || 'unset';
    style.alignItems = state.alignItems || 'unset';
    style.justifyContent = state.justifyContent || 'unset';
    style.flexGrow = 1;

    if (state.md) {
      style[theme.breakpoints.down('md')] = {
        gridTemplateRows: state.md?.templateRows,
        gridTemplateColumns: state.md?.templateColumns,
        rowGap: state.md.rowGap ? theme.spacing(state.md?.rowGap ?? 1) : undefined,
        columnGap: state.md.columnGap ? theme.spacing(state.md?.rowGap ?? 1) : undefined,
        justifyItems: state.md?.justifyItems,
        alignItems: state.md?.alignItems,
        justifyContent: state.md?.justifyContent,
      };
    }

    return css(style);
  }, [state]);
}
