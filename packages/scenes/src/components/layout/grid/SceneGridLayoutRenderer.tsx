import React from 'react';
import ReactGridLayout from 'react-grid-layout';
import AutoSizer from 'react-virtualized-auto-sizer';
import { SceneComponentProps } from '../../../core/types';
import { GRID_CELL_VMARGIN, GRID_COLUMN_COUNT, GRID_CELL_HEIGHT } from './constants';
import { LazyLoader, Props } from './LazyLoader';
import { SceneGridLayout } from './SceneGridLayout';
import { SceneGridItemLike } from './types';

export function SceneGridLayoutRenderer({ model }: SceneComponentProps<SceneGridLayout>) {
  const { children, isLazy } = model.useState();
  const LazyWrapper = isLazy ? LazyLoader : ({ style, children }: Props) => <div style={style}>{children}</div>;
  validateChildrenSize(children);
  
  return (
    <AutoSizer disableHeight>
      {({ width }) => {
        if (width === 0) {
          return null;
        }

        const layout = model.buildGridLayout(width);

        const cellWidth = (width - (GRID_COLUMN_COUNT - 1) * GRID_CELL_VMARGIN) / GRID_COLUMN_COUNT;
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
                const pixelWidth = cellToPixelSize(sceneChild.state.width ?? 0, cellWidth, GRID_CELL_VMARGIN);
                const pixelHeight = cellToPixelSize(sceneChild.state.height ?? 0, GRID_CELL_HEIGHT, GRID_CELL_VMARGIN);

                // Need a wrapper around LazyLoader as ReactGridLayout expects a
                // class component to give a ref to.
                return (
                  <div style={{ display: 'flex' }} key={sceneChild.state.key}>
                    <LazyWrapper width={pixelWidth} height={pixelHeight} style={{ display: 'flex' }}>
                      <sceneChild.Component model={sceneChild} key={sceneChild.state.key} />
                    </LazyWrapper>
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

function validateChildrenSize(children: SceneGridItemLike[]) {
  if (
    children.some(
      (c) =>
        c.state.height === undefined ||
        c.state.width === undefined ||
        c.state.x === undefined ||
        c.state.y === undefined
    )
  ) {
    throw new Error('All children must have a size specified');
  }
}

function cellToPixelSize(sizeInCells: number, sizeOfCellInPx: number, margin = 0) {
  return Math.max(Math.round(sizeInCells * (sizeOfCellInPx + margin) - margin), 0);
}
