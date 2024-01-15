import React, { useCallback, useMemo, useReducer, useRef } from 'react';
import ReactGridLayout from 'react-grid-layout';
import AutoSizer from 'react-virtualized-auto-sizer';
import { SceneComponentProps } from '../../../core/types';
import { GRID_CELL_VMARGIN, GRID_COLUMN_COUNT, GRID_CELL_HEIGHT } from './constants';
import { LazyLoader } from '../LazyLoader';
import { SceneGridLayout } from './SceneGridLayout';
import { SceneGridItemLike } from './types';
// @ts-expect-error TODO remove when @grafana/ui is upgraded to 10.4
import { LayoutItemContext, useTheme2 } from '@grafana/ui';

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
              {layout.map((gridItem, index) => (
                <GridItemWrapper
                  key={gridItem.i}
                  grid={model}
                  layoutItem={gridItem}
                  index={index}
                  isLazy={isLazy}
                  totalCount={layout.length}
                />
              ))}
            </ReactGridLayout>
          </div>
        );
      }}
    </AutoSizer>
  );
}

interface GridItemWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  grid: SceneGridLayout;
  layoutItem: ReactGridLayout.Layout;
  index: number;
  totalCount: number;
  isLazy?: boolean;
}

const GridItemWrapper = React.forwardRef<HTMLDivElement, GridItemWrapperProps>((props, ref) => {
  const { grid, layoutItem, index, totalCount, isLazy, style } = props;
  const sceneChild = grid.getSceneLayoutChild(layoutItem.i)!;
  const className = sceneChild.getClassName?.();
  const theme = useTheme2();

  const boostedCount = useRef(0);
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  const boostZIndex = useCallback(() => {
    boostedCount.current += 1;
    forceUpdate();

    return () => {
      boostedCount.current -= 1;
      forceUpdate();
    };
  }, [forceUpdate]);

  const ctxValue = useMemo(() => ({ boostZIndex }), [boostZIndex]);
  const descIndex = totalCount - index;
  const innerContent = <sceneChild.Component model={sceneChild} key={sceneChild.state.key} />;
  const innerContentWithContext = LayoutItemContext ? (
    <LayoutItemContext.Provider value={ctxValue}>{innerContent}</LayoutItemContext.Provider>
  ) : (
    innerContent
  );

  style!.zIndex = boostedCount.current === 0 ? descIndex : theme.zIndex.dropdown;

  if (isLazy) {
    return (
      <LazyLoader
        key={sceneChild.state.key!}
        data-griditem-key={sceneChild.state.key}
        className={className}
        style={style}
        ref={ref}
      >
        {innerContentWithContext}
      </LazyLoader>
    );
  }

  return (
    <div
      ref={ref}
      key={sceneChild.state.key}
      data-griditem-key={sceneChild.state.key}
      className={className}
      style={style}
    >
      {innerContentWithContext}
    </div>
  );
});

GridItemWrapper.displayName = 'GridItemWrapper';

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
