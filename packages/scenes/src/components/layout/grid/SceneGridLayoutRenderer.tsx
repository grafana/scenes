import React from 'react';
import ReactGridLayout from 'react-grid-layout';
import AutoSizer from 'react-virtualized-auto-sizer';
import { SceneComponentProps } from '../../../core/types';
import { GRID_CELL_HEIGHT, GRID_CELL_VMARGIN, GRID_COLUMN_COUNT } from './constants';
import { LazyLoader } from '../LazyLoader';
import { SceneGridLayout } from './SceneGridLayout';
import { SceneGridItemLike } from './types';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export function SceneGridLayoutRenderer({ model }: SceneComponentProps<SceneGridLayout>) {
  const { children, isLazy, isDraggable, isResizable } = model.useState();

  validateChildrenSize(children);

  return (
    <AutoSizer>
      {({ width, height }) => {
        if (width === 0) {
          return null;
        }

        const layout = model.buildGridLayout(width, height);

        return (
          /**
           * The children is using a width of 100% so we need to guarantee that it is wrapped
           * in an element that has the calculated size given by the AutoSizer. The AutoSizer
           * has a width of 0 and will let its content overflow its div.
           */
          <div
            style={{ width: `${width}px`, height: '100%', position: 'relative', zIndex: 1 }}
            className={cx('react-grid-layout', isDraggable && 'react-grid-layout--enable-move-animations')}
          >
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
              useCSSTransforms={true}
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
              resizeHandle={<ResizeHandle />}
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
  const { grid, layoutItem, index, totalCount, isLazy, style, onLoad, onChange, children, ...divProps } = props;
  const sceneChild = grid.getSceneLayoutChild(layoutItem.i)!;
  const className = sceneChild.getClassName?.();

  const innerContent = <sceneChild.Component model={sceneChild} key={sceneChild.state.key} />;

  if (isLazy) {
    return (
      <LazyLoader
        {...divProps}
        key={sceneChild.state.key!}
        data-griditem-key={sceneChild.state.key}
        className={cx(className, props.className)}
        style={style}
        ref={ref}
      >
        {innerContent}
        {children}
      </LazyLoader>
    );
  }

  return (
    <div
      {...divProps}
      ref={ref}
      key={sceneChild.state.key}
      data-griditem-key={sceneChild.state.key}
      className={cx(className, props.className)}
      style={style}
    >
      {innerContent}
      {children}
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

interface ResizeHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  handleAxis?: string;
}

const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(({ handleAxis, ...divProps }, ref) => {
  const customCssClass = useStyles2(getResizeHandleStyles);

  return (
    <div ref={ref} {...divProps} className={`${customCssClass} scene-resize-handle`}>
      <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21 15L15 21M21 8L8 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

ResizeHandle.displayName = 'ResizeHandle';

function getResizeHandleStyles(theme: GrafanaTheme2) {
  return css({
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 999,
    padding: theme.spacing(1.5, 0, 0, 1.5),
    color: theme.colors.border.strong,
    cursor: 'se-resize',
    '&:hover': {
      color: theme.colors.text.link,
    },
    svg: {
      display: 'block',
    },
    '.react-resizable-hide &': {
      display: 'none',
    },
  });
}
