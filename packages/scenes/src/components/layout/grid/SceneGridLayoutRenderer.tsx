import React from 'react';
import ReactGridLayout from 'react-grid-layout';
import AutoSizer from 'react-virtualized-auto-sizer';
import { SceneComponentProps } from '../../../core/types';
import { GRID_CELL_VMARGIN, GRID_COLUMN_COUNT, GRID_CELL_HEIGHT } from './constants';
import { LazyLoader } from './LazyLoader';
import { SceneGridLayout } from './SceneGridLayout';
import { SceneGridItemLike } from './types';

export function SceneGridLayoutRenderer({ model }: SceneComponentProps<SceneGridLayout>) {
  const { children, isLazy, isDraggable, isResizable } = model.useState();
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
              /**
                Disable draggable if mobile device, solving an issue with unintentionally
                moving panels. https://github.com/grafana/grafana/issues/18497
                theme.breakpoints.md = 769
               */
              isDraggable={isDraggable && width > 768}
              isResizable={isResizable ?? false}
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
                const className = sceneChild.getClassName?.();

                return isLazy ? (
                  <LazyLoader key={sceneChild.state.key!} data-panelid={sceneChild.state.key} className={className}>
                    <sceneChild.Component model={sceneChild} key={sceneChild.state.key} />
                  </LazyLoader>
                ) : (
                  <div key={sceneChild.state.key} data-panelid={sceneChild.state.key} className={className}>
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
