import ReactGridLayout from 'react-grid-layout';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneLayout, SceneObjectState } from '../../../core/types';
import { DEFAULT_PANEL_SPAN } from './constants';
import { isSceneGridRow } from './SceneGridItem';
import { SceneGridLayoutRenderer } from './SceneGridLayoutRenderer';

import { SceneGridRow } from './SceneGridRow';
import { SceneGridItemLike, SceneGridItemPlacement } from './types';

interface SceneGridLayoutState extends SceneObjectState {
  /**
   * Turn on or off dragging for all items. Indiviadual items can still disabled via isDraggable property
   **/
  isDraggable?: boolean;
  /** Enable or disable item resizing */
  isResizable?: boolean;
  isLazy?: boolean;
  children: SceneGridItemLike[];
}

export class SceneGridLayout extends SceneObjectBase<SceneGridLayoutState> implements SceneLayout {
  public static Component = SceneGridLayoutRenderer;

  private _skipOnLayoutChange = false;

  public constructor(state: SceneGridLayoutState) {
    super({
      ...state,
      children: sortChildrenByPosition(state.children),
    });
  }

  /**
   * SceneLayout interface. Used for example by VizPanelRenderer
   */
  public isDraggable(): boolean {
    return this.state.isDraggable ?? false;
  }

  public getDragClass() {
    return `grid-drag-handle-${this.state.key}`;
  }

  public getDragClassCancel() {
    return `grid-drag-cancel`;
  }

  public toggleRow(row: SceneGridRow) {
    const isCollapsed = row.state.isCollapsed;

    if (!isCollapsed) {
      row.setState({ isCollapsed: true });
      // To force re-render
      this.setState({});
      return;
    }

    const rowChildren = row.state.children;

    if (rowChildren.length === 0) {
      row.setState({ isCollapsed: false });
      this.setState({});
      return;
    }

    // Ok we are expanding row. We need to update row children y pos (incase they are incorrect) and push items below down
    // Code copied from DashboardModel toggleRow()

    const rowY = row.state.y!;
    const firstPanelYPos = rowChildren[0].state.y ?? rowY;
    const yDiff = firstPanelYPos - (rowY + 1);

    // y max will represent the bottom y pos after all panels have been added
    // needed to know home much panels below should be pushed down
    let yMax = rowY;

    for (const panel of rowChildren) {
      // set the y gridPos if it wasn't already set
      const newSize = { ...panel.state };
      newSize.y = newSize.y ?? rowY;
      // make sure y is adjusted (in case row moved while collapsed)
      newSize.y -= yDiff;

      if (newSize.y! !== panel.state.y!) {
        panel.setState(newSize);
      }

      // update insert post and y max
      yMax = Math.max(yMax, Number(newSize.y!) + Number(newSize.height!));
    }

    const pushDownAmount = yMax - rowY - 1;

    // push panels below down
    for (const child of this.state.children) {
      if (child.state.y! > rowY) {
        this.pushChildDown(child, pushDownAmount);
      }

      if (isSceneGridRow(child) && child !== row) {
        for (const rowChild of child.state.children) {
          if (rowChild.state.y! > rowY) {
            this.pushChildDown(rowChild, pushDownAmount);
          }
        }
      }
    }

    row.setState({ isCollapsed: false });
    // Trigger re-render
    this.setState({});
  }

  public onLayoutChange = (layout: ReactGridLayout.Layout[]) => {
    if (this._skipOnLayoutChange) {
      // Layout has been updated by other RTL handler already
      this._skipOnLayoutChange = false;
      return;
    }

    for (const item of layout) {
      const child = this.getSceneLayoutChild(item.i);

      const nextSize: SceneGridItemPlacement = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      if (!isItemSizeEqual(child.state, nextSize)) {
        child.setState({
          ...nextSize,
        });
      }
    }

    this.setState({ children: sortChildrenByPosition(this.state.children) });
  };

  /**
   * Will also scan row children and return child of the row
   */
  public getSceneLayoutChild(key: string): SceneGridItemLike {
    for (const child of this.state.children) {
      if (child.state.key === key) {
        return child;
      }

      if (child instanceof SceneGridRow) {
        for (const rowChild of child.state.children) {
          if (rowChild.state.key === key) {
            return rowChild;
          }
        }
      }
    }

    throw new Error('Scene layout child not found for GridItem');
  }

  public onResizeStop: ReactGridLayout.ItemCallback = (_, o, n) => {
    const child = this.getSceneLayoutChild(n.i);
    child.setState({
      width: n.w,
      height: n.h,
    });
  };

  private pushChildDown(child: SceneGridItemLike, amount: number) {
    child.setState({
      y: child.state.y! + amount,
    });
  }

  /**
   *  We assume the layout array is storted according to y pos, and walk upwards until we find a row.
   *  If it is collapsed there is no row to add it to. The default is then to return the SceneGridLayout itself
   */
  private findGridItemSceneParent(layout: ReactGridLayout.Layout[], startAt: number): SceneGridRow | SceneGridLayout {
    for (let i = startAt; i >= 0; i--) {
      const gridItem = layout[i];
      const sceneChild = this.getSceneLayoutChild(gridItem.i);

      if (sceneChild instanceof SceneGridRow) {
        // the closest row is collapsed return null
        if (sceneChild.state.isCollapsed) {
          return this;
        }

        return sceneChild;
      }
    }

    return this;
  }

  /**
   * This likely needs a slighltly different approach. Where we clone or deactivate or and re-activate the moved child
   */
  public moveChildTo(child: SceneGridItemLike, target: SceneGridLayout | SceneGridRow) {
    const currentParent = child.parent!;
    let rootChildren = this.state.children;

    const newChild = child.clone({ key: child.state.key });

    // Remove from current parent row
    if (currentParent instanceof SceneGridRow) {
      const newRow = currentParent.clone({
        children: currentParent.state.children.filter((c) => c.state.key !== child.state.key),
      });

      // new children with new row
      rootChildren = rootChildren.map((c) => (c === currentParent ? newRow : c));

      // if target is also a row
      if (target instanceof SceneGridRow) {
        const targetRow = target.clone({ children: [...target.state.children, newChild] });
        rootChildren = rootChildren.map((c) => (c === target ? targetRow : c));
      } else {
        // target is the main grid
        rootChildren = [...rootChildren, newChild];
      }
    } else {
      if (!(target instanceof SceneGridLayout)) {
        // current parent is the main grid remove it from there
        rootChildren = rootChildren.filter((c) => c.state.key !== child.state.key);
        // Clone the target row and add the child
        const targetRow = target.clone({ children: [...target.state.children, newChild] });
        // Replace row with new row
        rootChildren = rootChildren.map((c) => (c === target ? targetRow : c));
      }
    }

    return rootChildren;
  }

  public onDragStop: ReactGridLayout.ItemCallback = (gridLayout, o, updatedItem) => {
    const sceneChild = this.getSceneLayoutChild(updatedItem.i)!;

    // Need to resort the grid layout based on new position (needed to to find the new parent)
    gridLayout = sortGridLayout(gridLayout);

    // Update children positions if they have changed
    for (let i = 0; i < gridLayout.length; i++) {
      const gridItem = gridLayout[i];
      const child = this.getSceneLayoutChild(gridItem.i)!;
      const childSize = child.state;

      if (childSize?.x !== gridItem.x || childSize?.y !== gridItem.y) {
        child.setState({
          x: gridItem.x,
          y: gridItem.y,
        });
      }
    }

    const indexOfUpdatedItem = gridLayout.findIndex((item) => item.i === updatedItem.i);
    let newChildren = this.state.children;

    // If the child is a row
    if (sceneChild instanceof SceneGridRow) {
      let indexOfSeparation = 0;

      // and we are drag and dropping this row inside another row, we need to
      for (let i = indexOfUpdatedItem - 1; i >= 0; i--) {
        const gridItem = gridLayout[i];
        const aboveRow = this.getSceneLayoutChild(gridItem.i);
  
        // find if there is another row above in tree and
        // get all children that are below this row from the row above and append them to this row
        if (aboveRow instanceof SceneGridRow && !aboveRow.state.isCollapsed) {
          const children = aboveRow.state.children;
          const toMoveChildren = children.splice(indexOfSeparation).map((c) => c.clone());

          aboveRow.setState({ children: children });
          sceneChild.setState({ children: [...sceneChild.state.children, ...toMoveChildren] });
        }

        indexOfSeparation ++;
      }
    } else {
      // Update the parent if the child if it has moved to a row or back to the grid
      const newParent = this.findGridItemSceneParent(gridLayout, indexOfUpdatedItem - 1);

      if (newParent !== sceneChild.parent) {
        newChildren = this.moveChildTo(sceneChild, newParent);
      }
    }

    this.setState({ children: sortChildrenByPosition(newChildren) });
    this._skipOnLayoutChange = true;
  };

  private toGridCell(child: SceneGridItemLike): ReactGridLayout.Layout {
    const size = child.state;

    let x = size.x ?? 0;
    let y = size.y ?? 0;
    const w = Number.isInteger(Number(size.width)) ? Number(size.width) : DEFAULT_PANEL_SPAN;
    const h = Number.isInteger(Number(size.height)) ? Number(size.height) : DEFAULT_PANEL_SPAN;

    let isDraggable = child.state.isDraggable;
    let isResizable = child.state.isResizable;

    if (child instanceof SceneGridRow) {
      isDraggable = child.state.isCollapsed ? true : false;
      isResizable = false;
    }

    return { i: child.state.key!, x, y, h, w, isResizable, isDraggable };
  }

  public buildGridLayout(width: number): ReactGridLayout.Layout[] {
    let cells: ReactGridLayout.Layout[] = [];

    for (const child of this.state.children) {
      cells.push(this.toGridCell(child));

      if (child instanceof SceneGridRow && !child.state.isCollapsed) {
        for (const rowChild of child.state.children) {
          cells.push(this.toGridCell(rowChild));
        }
      }
    }

    // Sort by position
    cells = sortGridLayout(cells);

    if (width < 768) {
      // We should not persist the mobile layout
      this._skipOnLayoutChange = true;
      return cells.map((cell) => ({ ...cell, w: 24 }));
    }

    this._skipOnLayoutChange = false;

    return cells;
  }
}

function isItemSizeEqual(a: SceneGridItemPlacement, b: SceneGridItemPlacement) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function sortChildrenByPosition(children: SceneGridItemLike[]) {
  return [...children].sort((a, b) => {
    return a.state.y! - b.state.y! || a.state.x! - b.state.x!;
  });
}

function sortGridLayout(layout: ReactGridLayout.Layout[]) {
  return [...layout].sort((a, b) => a.y - b.y || a.x! - b.x);
}
