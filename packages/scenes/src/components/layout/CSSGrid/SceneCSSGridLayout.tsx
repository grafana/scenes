import { css } from '@emotion/css';
import React, { ComponentType, CSSProperties, useLayoutEffect, useRef } from 'react';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneLayout, SceneObjectState, SceneObject } from '../../../core/types';
import { LazyLoader } from '../LazyLoader';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { SceneCSSGridItem, SceneCSSGridItemRenderProps } from './SceneCSSGridItem';
import { DragManager, DropZone } from './DragManager';

export interface SceneCSSGridLayoutState extends SceneObjectState, SceneCSSGridLayoutOptions {
  children: Array<SceneCSSGridItem | SceneObject>;
  /**
   * True when the item should rendered but not visible.
   * Useful for conditional display of layout items
   */
  isHidden?: boolean;
  /**
   * For media query for sceens smaller than md breakpoint
   */
  md?: SceneCSSGridLayoutOptions;
  /** True when the items should be lazy loaded */
  isLazy?: boolean;
}

export interface SceneCSSGridLayoutOptions {
  /**
   * Useful for setting a height on items without specifying how many rows there will be.
   * Defaults to 320px
   */
  autoRows?: CSSProperties['gridAutoRows'];
  /**
   * This overrides the autoRows with a specific row template.
   */
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
}

export class SceneCSSGridLayout extends SceneObjectBase<SceneCSSGridLayoutState> implements SceneLayout {
  public static Component = SceneCSSGridLayoutRenderer;

  public dragManager: DragManager | undefined;
  public constructor(state: Partial<SceneCSSGridLayoutState>) {
    super({
      rowGap: 1,
      columnGap: 1,
      templateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      autoRows: state.autoRows ?? `320px`,
      children: state.children ?? [],
      ...state,
    });

    this.onPointerDown = this.onPointerDown.bind(this);
    this.addActivationHandler(() => {
      const dragManager = findDragManager(this);
      if (dragManager) {
        this.dragManager = dragManager;
        this.dragManager.registerLayout(this);
      }
    });
  }

  public isDraggable(): boolean {
    return true;
  }

  public getDragClass() {
    return `grid-drag-handle-${this.state.key}`;
  }

  public getDragClassCancel() {
    return 'grid-drag-cancel';
  }

  public onPointerDown(e: React.PointerEvent, item: SceneObject) {
    if (!this.container || this.cannotDrag(e.target) || !this.dragManager) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.dragManager.onDragStart(e.nativeEvent, this, item);
  }

  private cannotDrag(el: EventTarget) {
    const dragCancelClass = this.getDragClassCancel();
    const dragClass = this.getDragClass();

    // cancel dragging if the element being interacted with has an ancestor with the drag cancel class set
    // or if the drag class isn't set on an ancestor
    const cannotDrag =
      el instanceof Element &&
      (el.classList.contains(dragCancelClass) ||
        el.matches(`.${dragCancelClass} *`) ||
        (!el.matches(`.${dragClass} *`) && !el.classList.contains(dragClass)));

    return cannotDrag;
  }

  private container: HTMLElement | undefined;
  public setContainer(el: HTMLElement) {
    this.container = el;
  }

  public getContainer() {
    return this.container;
  }

  public getDropZones() {
    if (!this.container) {
      return [];
    }

    const layoutHasVisibleChildren =
      [...this.container.children].filter((n) => Number.parseInt(n.getAttribute('data-order') ?? '0', 10) > -1).length >
      0;
    if (!layoutHasVisibleChildren) {
      const child = this.container.appendChild(document.createElement('div'));
      child.setAttribute('data-order', '99999');
      const cells = calculateGridCells(this.container).filter((c) => c.order >= 0);
      this.container.removeChild(child);
      return cells;
    }

    return calculateGridCells(this.container).filter((c) => c.order >= 0);
  }
}

const dragManagerDefaults = { activeItem: undefined, activeLayout: undefined, dropZone: undefined };
function SceneCSSGridLayoutRenderer({ model }: SceneCSSGridItemRenderProps<SceneCSSGridLayout>) {
  const { children, isHidden, isLazy } = model.useState();
  const styles = useStyles2(getStyles, model.state);
  const containerRef = useRef<HTMLDivElement>(null);
  const oldDropZone = useRef<DropZone>();
  // Probably a rules-of-hooks violation waiting to happen. Need to think of a better solution
  const { activeItem, activeLayout, dropZone } = model.dragManager?.useState() ?? dragManagerDefaults;

  const currentLayoutIsActive = model === activeLayout && activeItem;

  if (!currentLayoutIsActive && containerRef.current) {
    containerRef.current.style.overflow = '';
    containerRef.current.style.height = '';
    containerRef.current.style.transition = '';
  }

  oldDropZone.current = dropZone;

  useLayoutEffect(() => {
    if (containerRef.current) {
      model.setContainer(containerRef.current);
    }
  });

  if (isHidden) {
    return null;
  }

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onPointerEnter={() => {
        if (!containerRef.current || model === activeLayout || !model.dragManager) {
          return;
        }

        model.dragManager.dropZones = [];
        model.dragManager.setState({ activeLayout: model, dropZone: undefined });
        
        // Probably a better way of doing this, but we have to wait for react to add the new placeholder
        // before we calculate the drop zones
        setTimeout(() => {
          model.dragManager?.refreshDropZones();
        }, 1);
      }}
    >
      {children.map((item, i) => {
        const Component = item.Component as ComponentType<SceneCSSGridItemRenderProps<SceneObject>>;
        const Wrapper = isLazy ? LazyLoader : 'div';
        const isHidden = 'isHidden' in item.state && typeof item.state.isHidden === 'boolean' && item.state.isHidden;
        const isDragging = item === activeItem;
        if (isDragging) {
          return null;
        }

        return (
          <Wrapper key={item.state.key!} className={styles.itemWrapper} data-order={isHidden ? -1 : i}>
            <Component model={item} parentState={model.state} />
          </Wrapper>
        );
      })}
      {currentLayoutIsActive && <div style={{ gridRow: dropZone?.rowIndex, gridColumn: dropZone?.columnIndex }}></div>}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2, state: SceneCSSGridLayoutState) => ({
  container: css({
    display: 'grid',
    position: 'relative',
    gridTemplateColumns: state.templateColumns,
    gridTemplateRows: state.templateRows || 'unset',
    gridAutoRows: state.autoRows || 'unset',
    rowGap: theme.spacing(state.rowGap ?? 1),
    columnGap: theme.spacing(state.columnGap ?? 1),
    justifyItems: state.justifyItems || 'unset',
    alignItems: state.alignItems || 'unset',
    justifyContent: state.justifyContent || 'unset',
    flexGrow: 1,

    [theme.breakpoints.down('md')]: state.md
      ? {
          gridTemplateRows: state.md.templateRows,
          gridTemplateColumns: state.md.templateColumns,
          rowGap: state.md.rowGap ? theme.spacing(state.md.rowGap ?? 1) : undefined,
          columnGap: state.md.columnGap ? theme.spacing(state.md.rowGap ?? 1) : undefined,
          justifyItems: state.md.justifyItems,
          alignItems: state.md.alignItems,
          justifyContent: state.md.justifyContent,
        }
      : undefined,
  }),
  itemWrapper: css({
    display: 'grid',
    overflow: 'hidden',
  }),
});

export interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  rowIndex: number;
  columnIndex: number;
  order: number;
}

function getGridStyles(gridElement: HTMLElement) {
  const gridStyles = getComputedStyle(gridElement);

  return {
    templateRows: gridStyles.gridTemplateRows.split(' ').map((row) => parseFloat(row)),
    templateColumns: gridStyles.gridTemplateColumns.split(' ').map((col) => parseFloat(col)),
    rowGap: parseFloat(gridStyles.rowGap),
    columnGap: parseFloat(gridStyles.columnGap),
  };
}

function calculateGridCells(gridElement: HTMLElement) {
  const { templateRows, templateColumns, rowGap, columnGap } = getGridStyles(gridElement);
  const gridBoundingBox = gridElement.getBoundingClientRect();
  const { scrollTop } = closestScroll(gridElement);
  const gridOrigin = { x: gridBoundingBox.left, y: gridBoundingBox.top + scrollTop };
  const ids = [...gridElement.children]
    .map((c, i) => Number.parseInt(c.getAttribute('data-order') ?? `${i}`, 10))
    .filter((v) => v >= 0);

  const rects: Rect[] = [];
  let yTotal = gridOrigin.y;
  for (let rowIndex = 0; rowIndex < templateRows.length; rowIndex++) {
    const height = templateRows[rowIndex];
    const row = {
      top: yTotal,
      bottom: yTotal + height,
    };
    yTotal = row.bottom + rowGap;

    let xTotal = gridOrigin.x;
    for (let colIndex = 0; colIndex < templateColumns.length; colIndex++) {
      const width = templateColumns[colIndex];
      const column = {
        left: xTotal,
        right: xTotal + width,
      };

      xTotal = column.right + columnGap;
      rects.push({
        left: column.left,
        right: column.right,
        top: row.top,
        bottom: row.bottom,
        rowIndex: rowIndex + 1,
        columnIndex: colIndex + 1,
        order: ids[rowIndex * templateColumns.length + colIndex],
      });
    }
  }

  return rects;
}

function canScroll(el: HTMLElement) {
  const oldScroll = el.scrollTop;
  el.scrollTop = Number.MAX_SAFE_INTEGER;
  const newScroll = el.scrollTop;
  el.scrollTop = oldScroll;

  return newScroll > 0;
}

function closestScroll(el?: HTMLElement | null): {
  scrollTop: number;
  scrollTopMax: number;
  wrapper?: HTMLElement | null;
} {
  if (el && canScroll(el)) {
    return { scrollTop: el.scrollTop, scrollTopMax: el.scrollHeight - el.clientHeight - 5, wrapper: el };
  }

  return el ? closestScroll(el.parentElement) : { scrollTop: 0, scrollTopMax: 0, wrapper: el };
}

function findDragManager(root: SceneObject | undefined) {
  if (!root) {
    return undefined;
  }

  const match = root.state.$behaviors?.find((b) => b instanceof DragManager);
  if (match) {
    return match;
  }

  return findDragManager(root.parent);
}
