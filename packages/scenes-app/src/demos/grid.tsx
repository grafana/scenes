import {
  SceneGridLayout,
  SceneGridItem,
  SceneFlexLayout,
  SceneFlexItem,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
  PanelBuilders,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectRef,
  SceneObjectState,
} from '@grafana/scenes';
import { GRID_CELL_HEIGHT, GRID_COLUMN_COUNT } from '@grafana/scenes/src/components/layout/grid/constants';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';
import { Button, IconButton } from '@grafana/ui';
import React from 'react';

export function getGridLayoutTest(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    tabs: [
      new SceneAppPage({
        title: 'Static',
        url: `${defaults.url}/static`,
        routePath: 'static',
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $data: getQueryRunnerWithRandomWalkQuery(),
            body: new SceneGridLayout({
              isLazy: true,
              isDraggable: true,
              isResizable: true,
              children: [
                new SceneGridItem({
                  x: 0,
                  y: 0,
                  width: 12,
                  height: 10,
                  isResizable: true,
                  isDraggable: true,
                  body: PanelBuilders.timeseries()
                    .setTitle('Draggable and resizable')
                    .setOption('legend', { showLegend: false })
                    .build(),
                }),
                new SceneGridItem({
                  x: 12,
                  y: 0,
                  width: 12,
                  height: 10,
                  isResizable: false,
                  isDraggable: false,
                  body: PanelBuilders.timeseries()
                    .setTitle('No drag and no resize')
                    .setOption('legend', { showLegend: false })
                    .build(),
                }),
                new SceneGridItem({
                  x: 0,
                  y: 11,
                  width: 24,
                  height: 10,
                  isDraggable: false,
                  isResizable: true,
                  body: new SceneFlexLayout({
                    direction: 'column',
                    // Auto 100% height for SceneFlexLayout inside grid is not working, need to make grid item display: flex
                    height: 10 * GRID_CELL_HEIGHT,
                    children: [
                      new SceneFlexItem({
                        body: PanelBuilders.timeseries().setTitle('Child of flex layout').build(),
                      }),
                      new SceneFlexItem({
                        body: PanelBuilders.timeseries().setTitle('Child of flex layout').build(),
                      }),
                    ],
                  }),
                }),
              ],
            }),
          });
        },
      }),
      new SceneAppPage({
        title: 'Dynamic',
        url: `${defaults.url}/dynamic`,
        routePath: 'dynamic',
        getScene: () => {
          const dynamicGrid = new SceneGridLayout({
            isLazy: true,
            isDraggable: true,
            isResizable: true,
            children: [],
          });
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $data: getQueryRunnerWithRandomWalkQuery(),
            controls: [new GridControls({ gridRef: new SceneObjectRef(dynamicGrid) })],
            body: dynamicGrid,
          });
        },
      }),
    ],
  });
}

interface GridControlsState extends SceneObjectState {
  gridRef: SceneObjectRef<SceneGridLayout>;
}

class GridControls extends SceneObjectBase<GridControlsState> {
  public onAdd = () => {
    const grid = this.state.gridRef.resolve();
    const { nextX, nextY } = this.getNextPlacement(grid);

    const item = new SceneGridItem({
      x: nextX,
      y: nextY,
      width: 12,
      height: 10,
      isResizable: true,
      isDraggable: true,
      body: PanelBuilders.timeseries()
        .setTitle(`Panel ${grid.state.children.length + 1}`)
        .setOption('legend', { showLegend: false })
        .setHeaderActions(
          <IconButton
            name="trash-alt"
            type="button"
            variant="destructive"
            onClick={() => this.removePanel(item)}
            aria-label="Remove panel"
          />
        )
        .build(),
    });

    grid.setState({ children: [...grid.state.children, item] });
  };

  private getNextPlacement = (grid: SceneGridLayout) => {
    type GridChild = SceneGridLayout['state']['children'][number];

    const lastItem = grid.state.children.reduce<GridChild | undefined>((last, child) => {
      if (!last) {
        return child;
      }

      const lastY = Number.isFinite(last.state.y) ? Number(last.state.y) : 0;
      const lastX = Number.isFinite(last.state.x) ? Number(last.state.x) : 0;
      const childY = Number.isFinite(child.state.y) ? Number(child.state.y) : 0;
      const childX = Number.isFinite(child.state.x) ? Number(child.state.x) : 0;

      return childY > lastY || (childY === lastY && childX > lastX) ? child : last;
    }, undefined);

    const lastX = Number.isFinite(lastItem?.state.x) ? Number(lastItem?.state.x) : 0;
    const lastY = Number.isFinite(lastItem?.state.y) ? Number(lastItem?.state.y) : 0;
    const lastWidth = Number.isFinite(lastItem?.state.width) ? Number(lastItem?.state.width) : 0;
    const lastHeight = Number.isFinite(lastItem?.state.height) ? Number(lastItem?.state.height) : 0;

    const canPlaceNextTo = lastX + lastWidth < GRID_COLUMN_COUNT;
    const nextX = canPlaceNextTo ? lastX + lastWidth : 0;
    const nextY = canPlaceNextTo ? lastY : lastY + lastHeight;

    return { nextX, nextY };
  };

  private removePanel = (item: SceneGridItem) => {
    const grid = this.state.gridRef.resolve();
    grid.setState({ children: grid.state.children.filter((child) => child !== item) });
  };

  static Component = ({ model }: SceneComponentProps<GridControls>) => {
    return (
      <Button variant="secondary" onClick={model.onAdd}>
        + Add panel
      </Button>
    );
  };
}
