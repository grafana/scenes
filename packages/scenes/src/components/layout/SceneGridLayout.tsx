import React from 'react';
import ReactGridLayout from 'react-grid-layout';
import AutoSizer from 'react-virtualized-auto-sizer';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  SceneComponentProps,
  SceneLayout,
  SceneLayoutChild,
  SceneLayoutState,
  SceneLayoutChildOptions,
} from '../../core/types';
import { DEFAULT_PANEL_SPAN, GRID_CELL_HEIGHT, GRID_CELL_VMARGIN, GRID_COLUMN_COUNT } from './constants';

import { SceneGridRow } from './SceneGridRow';

interface SceneGridLayoutState extends SceneLayoutState {
  /**
   * Turn on or off dragging for all items. Indiviadual items can still disabled via placement.isDraggable
   **/
  isDraggable?: boolean;
}

export class SceneGridLayout extends SceneObjectBase<SceneGridLayoutState> implements SceneLayout {
  public static Component = SceneGridLayoutRenderer;

  private _skipOnLayoutChange = false;

  public constructor(state: SceneGridLayoutState) {
    super({
      ...state,
      isDraggable: true,
      placement: state.placement,
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

    const rowY = row.state.placement?.y!;
    const firstPanelYPos = rowChildren[0].state.placement?.y ?? rowY;
    const yDiff = firstPanelYPos - (rowY + 1);

    // y max will represent the bottom y pos after all panels have been added
    // needed to know home much panels below should be pushed down
    let yMax = rowY;

    for (const panel of rowChildren) {
      // set the y gridPos if it wasn't already set
      const newSize = { ...panel.state.placement };
      newSize.y = newSize.y ?? rowY;
      // make sure y is adjusted (in case row moved while collapsed)
      newSize.y -= yDiff;
      if (newSize.y > panel.state.placement?.y!) {
        panel.setState({ placement: newSize });
      }
      // update insert post and y max
      yMax = Math.max(yMax, Number(newSize.y!) + Number(newSize.height!));
    }

    const pushDownAmount = yMax - rowY - 1;

    // push panels below down
    for (const child of this.state.children) {
      if (child.state.placement?.y! > rowY) {
        this.pushChildDown(child, pushDownAmount);
      }

      if (child instanceof SceneGridRow && child !== row) {
        for (const rowChild of child.state.children) {
          if (rowChild.state.placement?.y! > rowY) {
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

      const nextSize = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      if (!isItemSizeEqual(child.state.placement!, nextSize)) {
        child.setState({
          placement: {
            ...child.state.placement,
            ...nextSize,
          },
        });
      }
    }

    this.setState({ children: sortChildrenByPosition(this.state.children) });
  };

  /**
   * Will also scan row children and return child of the row
   */
  public getSceneLayoutChild(key: string) {
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
      placement: {
        ...child.state.placement,
        width: n.w,
        height: n.h,
      },
    });
  };

  private pushChildDown(child: SceneLayoutChild, amount: number) {
    child.setState({
      placement: {
        ...child.state.placement,
        y: child.state.placement?.y! + amount,
      },
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
  public moveChildTo(child: SceneLayoutChild, target: SceneGridLayout | SceneGridRow) {
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
      // current parent is the main grid remove it from there
      rootChildren = rootChildren.filter((c) => c.state.key !== child.state.key);
      // Clone the target row and add the child
      const targetRow = target.clone({ children: [...target.state.children, newChild] });
      // Replace row with new row
      rootChildren = rootChildren.map((c) => (c === target ? targetRow : c));
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
      const childSize = child.state.placement!;

      if (childSize?.x !== gridItem.x || childSize?.y !== gridItem.y) {
        child.setState({
          placement: {
            ...child.state.placement,
            x: gridItem.x,
            y: gridItem.y,
          },
        });
      }
    }

    // Update the parent if the child if it has moved to a row or back to the grid
    const indexOfUpdatedItem = gridLayout.findIndex((item) => item.i === updatedItem.i);
    const newParent = this.findGridItemSceneParent(gridLayout, indexOfUpdatedItem - 1);
    let newChildren = this.state.children;

    if (newParent !== sceneChild.parent) {
      newChildren = this.moveChildTo(sceneChild, newParent);
    }

    this.setState({ children: sortChildrenByPosition(newChildren) });
    this._skipOnLayoutChange = true;
  };

  private toGridCell(child: SceneLayoutChild): ReactGridLayout.Layout {
    const size = child.state.placement!;

    let x = size.x ?? 0;
    let y = size.y ?? 0;
    const w = Number.isInteger(Number(size.width)) ? Number(size.width) : DEFAULT_PANEL_SPAN;
    const h = Number.isInteger(Number(size.height)) ? Number(size.height) : DEFAULT_PANEL_SPAN;

    let isDraggable = Boolean(child.state.placement?.isDraggable);
    let isResizable = Boolean(child.state.placement?.isResizable);

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

function SceneGridLayoutRenderer({ model }: SceneComponentProps<SceneGridLayout>) {
  const { children } = model.useState();
  validateChildrenSize(children);

  return (
    <AutoSizer disableHeight>
      {({ width }) => {
        if (width === 0) {
          return null;
        }

        const layout = model.buildGridLayout(width);

        return (
          /**
           * The children is using a width of 100% so we need to guarantee that it is wrapped
           * in an element that has the calculated size given by the AutoSizer. The AutoSizer
           * has a width of 0 and will let its content overflow its div.
           */
          <div style={{ width: `${width}px`, height: '100%' }}>
            <ReactGridLayout
              width={width}
              /*
                  Disable draggable if mobile device, solving an issue with unintentionally
                  moving panels. https://github.com/grafana/grafana/issues/18497
                  theme.breakpoints.md = 769
                */
              isDraggable={width > 768}
              isResizable={false}
              containerPadding={[0, 0]}
              useCSSTransforms={false}
              margin={[GRID_CELL_VMARGIN, GRID_CELL_VMARGIN]}
              cols={GRID_COLUMN_COUNT}
              rowHeight={GRID_CELL_HEIGHT}
              draggableHandle={`.grid-drag-handle-${model.state.key}`}
              draggableCancel=".grid-drag-cancel"
              // @ts-ignore: ignoring for now until we make the size type numbers-only
              layout={layout}
              onDragStop={model.onDragStop}
              onResizeStop={model.onResizeStop}
              onLayoutChange={model.onLayoutChange}
              isBounded={false}
            >
              {layout.map((gridItem) => {
                const sceneChild = model.getSceneLayoutChild(gridItem.i)!;
                return (
                  <div key={sceneChild.state.key} style={{ display: 'flex' }}>
                    <sceneChild.Component model={sceneChild} key={sceneChild.state.key} />
                  </div>
                );
              })}
            </ReactGridLayout>
          </div>
        );
      }}
    </AutoSizer>
  );
}

function validateChildrenSize(children: SceneLayoutChild[]) {
  if (
    children.find(
      (c) =>
        !c.state.placement ||
        c.state.placement.height === undefined ||
        c.state.placement.width === undefined ||
        c.state.placement.x === undefined ||
        c.state.placement.y === undefined
    )
  ) {
    throw new Error('All children must have a size specified');
  }
}

function isItemSizeEqual(a: SceneLayoutChildOptions, b: SceneLayoutChildOptions) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function sortChildrenByPosition(children: SceneLayoutChild[]) {
  return [...children].sort((a, b) => {
    return a.state.placement?.y! - b.state.placement?.y! || a.state.placement?.x! - b.state.placement?.x!;
  });
}

function sortGridLayout(layout: ReactGridLayout.Layout[]) {
  return [...layout].sort((a, b) => a.y - b.y || a.x! - b.x);
}
