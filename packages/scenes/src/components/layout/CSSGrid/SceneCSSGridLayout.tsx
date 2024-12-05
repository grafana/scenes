import { css } from '@emotion/css';
import React, { ComponentType, CSSProperties, useLayoutEffect, useRef } from 'react';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneLayout, SceneObjectState, SceneObject } from '../../../core/types';
import { LazyLoader } from '../LazyLoader';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { SceneCSSGridItem, SceneCSSGridItemRenderProps } from './SceneCSSGridItem';

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
  _draggingIndex?: number;
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

  private gridCells: Rect[] = [];
  private dragOffset = { x: 0, y: 0 };
  private previewCell: Rect | undefined;
  private oldCursor = '';

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
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
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

  public onPointerDown(e: React.PointerEvent) {
    if (!this.container || this.cannotDrag(e.target)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.oldCursor = document.body.style.cursor;
    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';
    document.body.setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);

    // Find closest grid cell and make note of which cell is closest to the current mouse position (it is the cell we are dragging)
    this.gridCells = calculateGridCells(this.container).slice(0, this.state.children.length);
    const mousePos = { x: e.clientX, y: e.clientY };
    const scrollTop = closestScroll(this.container);
    this.previewCell = closestCell(this.gridCells, { x: mousePos.x, y: mousePos.y + scrollTop});

    // get the layout item that occupies the previously found closest cell
    this.draggingRef = this.container.children[this.previewCell.order + 1] as HTMLElement;
    const elementBox = this.draggingRef.getBoundingClientRect();
    this.dragOffset = { x: e.clientX - elementBox.left, y: e.clientY - elementBox.top };

    // set the layout item's dimensions to what they were when they were in the grid
    const computedStyles = getComputedStyle(this.draggingRef);
    const newCoords = { x: mousePos.x - this.dragOffset.x, y: mousePos.y - this.dragOffset.y };
    this.draggingRef.style.width = computedStyles.width;
    this.draggingRef.style.height = computedStyles.height;
    this.draggingRef.style.transform = `translate(${newCoords.x}px,${newCoords.y}px)`;
    this.draggingRef.style.zIndex = '999999';
    this.draggingRef.style.position = 'fixed';
    this.draggingRef.style.top = '0';
    this.draggingRef.style.left = '0';

    this.movePreviewToCell(this.previewCell.rowIndex, this.previewCell.columnIndex);

    // setting _draggingIndex re-renders the component and sets the various element refs referred to in the onPointerMove/Up handlers
    this.setState({ _draggingIndex: this.previewCell.order });
  }

  private onPointerMove(e: PointerEvent) {
    // seems to get called after onPointerDown is called and after the component re-renders, so element refs should all be set
    // but if there's ever weird behavior it's probably a race condition related to this
    e.preventDefault();
    e.stopPropagation();

    // we're not dragging but this handler was called, maybe left mouse was lifted on a different screen or something
    const notDragging = !(e.buttons & 1);
    if (notDragging) {
      this.onPointerUp(e);
      return;
    }

    if (this.draggingRef) {
      const dragCurrent = { x: e.clientX, y: e.clientY };
      const newX = dragCurrent.x - this.dragOffset.x;
      const newY = dragCurrent.y - this.dragOffset.y;
      this.draggingRef.style.transform = `translate(${newX}px,${newY}px)`;

      const scrollTop = closestScroll(this.draggingRef);
      const closestGridCell = closestCell(this.gridCells, { x: dragCurrent.x, y: dragCurrent.y + scrollTop });
      const closestIndex = closestGridCell.order;

      const newCellEntered =
        this.previewCell &&
        (closestGridCell.columnIndex !== this.previewCell.columnIndex ||
          closestGridCell.rowIndex !== this.previewCell.rowIndex);

      if (newCellEntered) {
        this.moveChild(this.previewCell!.order, closestIndex);
        this.previewCell = closestGridCell;
        this.movePreviewToCell(this.previewCell.rowIndex, this.previewCell.columnIndex);
        this.setState({ _draggingIndex: closestIndex });
      }
    }
  }

  private onPointerUp(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();

    document.body.style.cursor = this.oldCursor;
    document.body.style.removeProperty('user-select');
    document.body.releasePointerCapture(e.pointerId);
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    clearInlineStyles(this.draggingRef);
    clearInlineStyles(this.dropPreview);

    this.setState({ _draggingIndex: undefined });
  }

  public onKeyDown(e: React.KeyboardEvent<HTMLElement>, itemIndex: number) {
    if (this.state._draggingIndex !== undefined) {
      return;
    }

    if (e.key === 'ArrowLeft') {
      if (itemIndex === 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      this.moveChild(itemIndex, itemIndex - 1);
    } else if (e.key === 'ArrowRight') {
      if (itemIndex === this.state.children.length - 1) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      this.moveChild(itemIndex, itemIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();

      const style = getComputedStyle(this.container!);
      const columns = style.gridTemplateColumns.split(' ');
      const columnCount = columns.length;
      const currentColumn = itemIndex % columnCount;
      const rows = style.gridTemplateRows.split(' ');
      const rowCount = rows.length;
      const currentRow = Math.floor(itemIndex / columnCount);

      let newRow = currentRow;
      if (e.key === 'ArrowUp' && currentRow > 0) {
        newRow = currentRow - 1;
      } else if (e.key === 'ArrowDown' && currentRow < rowCount - 1) {
        newRow = currentRow + 1;
      }

      const newIndex = newRow * columnCount + currentColumn;
      this.moveChild(itemIndex, newIndex);
    }
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

  private moveChild(from: number, to: number) {
    const children = [...this.state.children];
    const childToMove = children.splice(from, 1)[0];
    children.splice(to, 0, childToMove);
    this.setState({ children });
  }

  private movePreviewToCell(rowIndex: number, columnIndex: number) {
    if (this.dropPreview) {
      this.dropPreview.style.position = 'relative';
      this.dropPreview.style.width = '100%';
      this.dropPreview.style.height = '100%';
      this.dropPreview.style.gridRow = `${rowIndex} / span 1`;
      this.dropPreview.style.gridColumn = `${columnIndex} / span 1`;
    }
  }

  private container: HTMLElement | undefined;
  public setContainer(el: HTMLElement) {
    this.container = el;
  }

  private dropPreview: HTMLElement | undefined;
  public setPreview(el: HTMLElement) {
    this.dropPreview = el;
  }

  private draggingRef: HTMLElement | undefined;
  public setDraggingRef(el: HTMLElement) {
    this.draggingRef = el;
  }
}

function SceneCSSGridLayoutRenderer({ model }: SceneCSSGridItemRenderProps<SceneCSSGridLayout>) {
  const { children, isHidden, isLazy, _draggingIndex } = model.useState();
  const styles = useStyles2(getStyles, model.state);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      model.setContainer(containerRef.current);
    }

    if (previewRef.current) {
      model.setPreview(previewRef.current);
    }

    if (draggingRef.current) {
      model.setDraggingRef(draggingRef.current);
    }
  });

  if (isHidden) {
    return null;
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.dropPreview} ref={previewRef}></div>
      {children.map((item, i) => {
        const Component = item.Component as ComponentType<SceneCSSGridItemRenderProps<SceneObject>>;
        const Wrapper = isLazy ? LazyLoader : 'div';

        return (
          <Wrapper
            key={item.state.key!}
            ref={_draggingIndex === i ? draggingRef : undefined}
            onKeyDown={(e) => model.onKeyDown(e, i)}
          >
            <Component model={item} parentState={model.state} />
          </Wrapper>
        );
      })}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2, state: SceneCSSGridLayoutState) => ({
  dropPreview: css({
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    background: theme.colors.primary.transparent,
    boxShadow: `0 0 4px ${theme.colors.primary.border}`,
  }),
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
});

interface Point {
  x: number;
  y: number;
}

interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  rowIndex: number;
  columnIndex: number;
  order: number;
}

function closestCell(rects: Rect[], point: Point) {
  let closest = rects[0];
  let shortestDistance = Number.MAX_SAFE_INTEGER;
  for (const rect of rects) {
    const rectMidpoint: Point = {
      x: rect.left + (rect.right - rect.left) / 2,
      y: rect.top + (rect.bottom - rect.top) / 2,
    };
    const distance = Math.hypot(rectMidpoint.x - point.x, rectMidpoint.y - point.y);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closest = rect;
    }
  }

  return closest;
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
  const scrollTop = closestScroll(gridElement);
  const gridOrigin = { x: gridBoundingBox.left, y: gridBoundingBox.top + scrollTop };

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
        order: rowIndex * templateColumns.length + colIndex,
      });
    }
  }

  return rects;
}

function clearInlineStyles(el?: HTMLElement) {
  if (!el) {
    return;
  }

  el.style.cssText = '';
}

function closestScroll(el?: HTMLElement | null): number {
  if (el && el.scrollTop > 0) {
    return el.scrollTop;
  }
  
  return el ? closestScroll(el.parentElement) : 0;
}
