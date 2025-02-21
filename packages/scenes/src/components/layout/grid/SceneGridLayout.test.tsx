import { render, screen } from '@testing-library/react';
import React from 'react';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../../../core/types';
import { EmbeddedScene } from '../../EmbeddedScene';
import { SceneGridItem } from './SceneGridItem';

import { SceneGridLayout } from './SceneGridLayout';
import { SceneGridRow } from './SceneGridRow';
import * as utils from './utils';

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [() => {}, { width: 800, height: 600 }],
}));

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  fitPanelsInHeight: jest.fn().mockImplementation((cells) => cells),
}));

class TestObject extends SceneObjectBase<SceneObjectState> {
  public static Component = (m: SceneComponentProps<TestObject>) => {
    return <div data-testid="test-object">TestObject</div>;
  };
}

describe('SceneGridLayout', () => {
  describe('rendering', () => {
    it('should render all grid children', async () => {
      const scene = new EmbeddedScene({
        body: new SceneGridLayout({
          children: [
            new SceneGridItem({
              x: 0,
              y: 0,
              width: 12,
              height: 5,
              isDraggable: false,
              isResizable: false,
              body: new TestObject({}),
            }),
            new SceneGridItem({
              x: 0,
              y: 5,
              width: 12,
              height: 5,
              isDraggable: false,
              isResizable: false,
              body: new TestObject({}),
            }),
          ],
          isLazy: false,
        }),
      });

      render(<scene.Component model={scene} />);

      expect(screen.queryAllByTestId('test-object')).toHaveLength(2);
    });

    it('should not render children of a collapsed row', async () => {
      const scene = new EmbeddedScene({
        body: new SceneGridLayout({
          children: [
            new SceneGridItem({
              x: 0,
              y: 0,
              width: 12,
              height: 5,
              isResizable: false,
              isDraggable: false,
              body: new TestObject({ key: 'a' }),
            }),
            new SceneGridItem({
              x: 0,
              y: 5,
              width: 12,
              height: 5,
              isResizable: false,
              isDraggable: false,
              body: new TestObject({ key: 'b' }),
            }),

            new SceneGridRow({
              title: 'Row A',
              key: 'Row A',
              isCollapsed: true,
              y: 10,
              children: [
                new SceneGridItem({
                  x: 0,
                  y: 11,
                  width: 12,
                  height: 5,
                  isResizable: false,
                  isDraggable: false,
                  body: new TestObject({ key: 'c' }),
                }),
              ],
            }),
          ],
          isLazy: false,
        }),
      });

      render(<scene.Component model={scene} />);

      expect(screen.queryAllByTestId('test-object')).toHaveLength(2);
    });

    it('should render children of an expanded row', async () => {
      const scene = new EmbeddedScene({
        body: new SceneGridLayout({
          children: [
            new SceneGridItem({
              x: 0,
              y: 0,
              width: 12,
              height: 5,
              isResizable: false,
              isDraggable: false,
              body: new TestObject({ key: 'a' }),
            }),
            new SceneGridItem({
              x: 0,
              y: 5,
              width: 12,
              height: 5,
              isResizable: false,
              isDraggable: false,
              body: new TestObject({ key: 'b' }),
            }),

            new SceneGridRow({
              title: 'Row A',
              key: 'Row A',
              isCollapsed: false,
              y: 10,
              children: [
                new SceneGridItem({
                  x: 0,
                  y: 11,
                  width: 12,
                  height: 5,
                  isResizable: false,
                  isDraggable: false,
                  body: new TestObject({ key: 'c' }),
                }),
              ],
            }),
          ],
          isLazy: false,
        }),
      });

      render(<scene.Component model={scene} />);

      expect(screen.queryAllByTestId('test-object')).toHaveLength(3);
    });

    it('should process the layout when the autofit is enabled', async () => {
      const scene = new EmbeddedScene({
        body: new SceneGridLayout({
          children: [
            new SceneGridItem({
              x: 0,
              y: 0,
              width: 12,
              height: 5,
              isResizable: false,
              isDraggable: false,
              body: new TestObject({ key: 'a' }),
            }),
            new SceneGridItem({
              x: 0,
              y: 5,
              width: 12,
              height: 5,
              isResizable: false,
              isDraggable: false,
              body: new TestObject({ key: 'b' }),
            }),
          ],
          isLazy: false,
          UNSAFE_fitPanels: true,
        }),
      });

      render(<scene.Component model={scene} />);

      expect(utils.fitPanelsInHeight).toHaveBeenCalled();
    });
  });

  describe('when moving a panel or row', () => {
    it('should update layout children placement and order ', () => {
      const layout = new SceneGridLayout({
        children: [
          new SceneGridItem({
            key: 'a',
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            isResizable: false,
            isDraggable: false,
            body: new TestObject({}),
          }),
          new SceneGridItem({
            key: 'b',
            x: 1,
            y: 0,
            width: 1,
            height: 1,
            isResizable: false,
            isDraggable: false,
            body: new TestObject({}),
          }),
          new SceneGridItem({
            key: 'c',
            x: 0,
            y: 1,
            width: 1,
            height: 1,
            isResizable: false,
            isDraggable: false,
            body: new TestObject({}),
          }),
        ],
        isLazy: false,
      });
      layout.onDragStop(
        [
          { i: 'b', x: 0, y: 0, w: 1, h: 1 },
          {
            i: 'a',
            x: 0,
            y: 1,
            w: 1,
            h: 1,
          },
          {
            i: 'c',
            x: 0,
            y: 2,
            w: 1,
            h: 1,
          },
        ],
        // @ts-expect-error
        {},
        { i: 'b', x: 0, y: 0, w: 1, h: 1 },
        {},
        {},
        {}
      );

      expect(layout.state.children[0].state.key).toEqual('b');
      expect(layout.state.children[0].state.x).toEqual(0);
      expect(layout.state.children[0].state.y).toEqual(0);
      expect(layout.state.children[0].state.width).toEqual(1);
      expect(layout.state.children[0].state.height).toEqual(1);
      expect(layout.state.children[1].state.key).toEqual('a');
      expect(layout.state.children[1].state.x).toEqual(0);
      expect(layout.state.children[1].state.y).toEqual(1);
      expect(layout.state.children[1].state.width).toEqual(1);
      expect(layout.state.children[1].state.height).toEqual(1);
      expect(layout.state.children[2].state.key).toEqual('c');
      expect(layout.state.children[2].state.x).toEqual(0);
      expect(layout.state.children[2].state.y).toEqual(2);
      expect(layout.state.children[2].state.width).toEqual(1);
      expect(layout.state.children[2].state.height).toEqual(1);
    });

    it('should update row children placement and order as well', () => {
      const layout = new SceneGridLayout({
        children: [
          new SceneGridItem({
            key: 'a',
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            isResizable: false,
            isDraggable: false,
            body: new TestObject({}),
          }),
          new SceneGridRow({
            title: 'Row A',
            key: 'row-a',
            isCollapsed: false,
            y: 1,
            children: [
              new SceneGridItem({
                key: 'b',
                x: 0,
                y: 2,
                width: 1,
                height: 1,
                isResizable: false,
                isDraggable: false,
                body: new TestObject({}),
              }),
            ],
          }),
        ],
        isLazy: false,
      });

      // move panel a to be the first child of the row:
      // row
      //  - a
      //  - b
      layout.onDragStop(
        [
          {
            w: 12,
            h: 8,
            x: 0,
            y: 2,
            i: 'a',
          },
          {
            w: 24,
            h: 1,
            x: 0,
            y: 0,
            i: 'row-a',
          },
          {
            w: 12,
            h: 8,
            x: 0,
            y: 10,
            i: 'b',
          },
        ],
        // @ts-expect-error
        {},
        {
          w: 12,
          h: 8,
          x: 0,
          y: 2,
          i: 'a',
        },
        {},
        {},
        {}
      );

      // after sorting by position, the row should have the children in the correct order [a,b]
      const row = layout.state.children[0] as SceneGridRow;

      expect(row.state.children[0].state.key).toEqual('a');
      expect(row.state.children[1].state.key).toEqual('b');

      // layout children should be positioned correctly
      expect(layout.state.children[0].state.key).toEqual('row-a');
      expect(layout.state.children[0].state.x).toEqual(0);
      expect(layout.state.children[0].state.y).toEqual(0);
      expect((layout.state.children[0] as SceneGridRow).state.children[0].state.key).toEqual('a');
      expect((layout.state.children[0] as SceneGridRow).state.children[0].state.x).toEqual(0);
      expect((layout.state.children[0] as SceneGridRow).state.children[0].state.y).toEqual(2);
      expect((layout.state.children[0] as SceneGridRow).state.children[1].state.key).toEqual('b');
      expect((layout.state.children[0] as SceneGridRow).state.children[1].state.x).toEqual(0);
      expect((layout.state.children[0] as SceneGridRow).state.children[1].state.y).toEqual(10);
    });

    it('should disallow dropping a row within another row and revert to initial layout', () => {
      const layout = new SceneGridLayout({
        children: [
          new SceneGridRow({
            title: 'Row B',
            key: 'row-b',
            isCollapsed: true,
            y: 0,
          }),
          new SceneGridRow({
            title: 'Row A',
            key: 'row-a',
            isCollapsed: false,
            y: 1,
            children: [
              new SceneGridItem({
                key: 'b',
                x: 0,
                y: 2,
                width: 1,
                height: 1,
                isResizable: false,
                isDraggable: false,
                body: new TestObject({}),
              }),
            ],
          }),
        ],
        isLazy: false,
      });

      // we save the initial layout here, if a state is invalid we will revert to this layout
      layout.onDragStart(
        [
          {
            w: 12,
            h: 8,
            x: 0,
            y: 0,
            i: 'row-b',
          },
          {
            w: 24,
            h: 1,
            x: 0,
            y: 1,
            i: 'row-a',
          },
          {
            w: 12,
            h: 8,
            x: 0,
            y: 2,
            i: 'b',
          },
        ],
        // @ts-expect-error
        {},
        {},
        {},
        {},
        {}
      );

      // move row-b to be the first child of the row-a:
      // row-a
      //  - row-b
      //  - b
      // this is an invalid state, we cannot have a row within another row
      layout.onDragStop(
        [
          {
            w: 12,
            h: 8,
            x: 0,
            y: 2,
            i: 'row-b',
          },
          {
            w: 24,
            h: 1,
            x: 0,
            y: 0,
            i: 'row-a',
          },
          {
            w: 12,
            h: 8,
            x: 0,
            y: 10,
            i: 'b',
          },
        ],
        // @ts-expect-error
        {},
        {
          w: 12,
          h: 8,
          x: 0,
          y: 2,
          i: 'row-b',
        },
        {},
        {},
        {}
      );

      //first call is skipped because onDragStop sets _skipOnLayoutChange
      layout.onLayoutChange([]);
      // layout argument is irrelevant because we are in an invalid state and will load the old layout in this func
      layout.onLayoutChange([]);

      // children state should be the same as in the beginning
      expect(layout.state.children[0].state.key).toEqual('row-b');
      expect(layout.state.children[0].state.y).toEqual(0);
      expect(layout.state.children[0].parent).toBeInstanceOf(SceneGridLayout);
      expect(layout.state.children[1].state.key).toEqual('row-a');
      expect(layout.state.children[1].state.y).toEqual(1);
      expect(layout.state.children[1].parent).toBeInstanceOf(SceneGridLayout);
      expect((layout.state.children[1] as SceneGridRow).state.children[0].state.key).toEqual('b');
      expect((layout.state.children[1] as SceneGridRow).state.children[0].state.y).toEqual(2);
    });

    it('should allow dropping a row around another uncollapsed row if state is valid', () => {
      const layout = new SceneGridLayout({
        children: [
          new SceneGridRow({
            title: 'Row B',
            key: 'row-b',
            isCollapsed: false,
            y: 0,
            children: [
              new SceneGridItem({
                key: 'b',
                x: 0,
                y: 1,
                width: 1,
                height: 1,
                isResizable: false,
                isDraggable: false,
                body: new TestObject({}),
              }),
            ],
          }),
          new SceneGridRow({
            title: 'Row A',
            key: 'row-a',
            isCollapsed: false,
            y: 2,
          }),
          new SceneGridRow({
            title: 'Row C',
            key: 'row-c',
            isCollapsed: true,
            y: 3,
          }),
        ],
        isLazy: false,
      });

      // we save the initial layout here, if a state is invalid we will revert to this layout
      layout.onDragStart(
        [
          {
            w: 12,
            h: 8,
            x: 0,
            y: 0,
            i: 'row-b',
          },
          {
            w: 24,
            h: 1,
            x: 0,
            y: 1,
            i: 'row-a',
          },
          {
            w: 12,
            h: 8,
            x: 0,
            y: 2,
            i: 'b',
          },
          {
            w: 24,
            h: 9,
            x: 0,
            y: 3,
            i: 'row-c',
          },
        ],
        // @ts-expect-error
        {},
        {},
        {},
        {},
        {}
      );

      // move row-c to be between 2 uncollapsed rows:
      // row-b
      //  - b
      // row-c
      // row-a
      const gridLayout = [
        {
          w: 12,
          h: 8,
          x: 0,
          y: 0,
          i: 'row-b',
        },
        {
          w: 12,
          h: 8,
          x: 0,
          y: 8,
          i: 'b',
        },
        {
          w: 24,
          h: 1,
          x: 0,
          y: 10,
          i: 'row-a',
        },
        {
          w: 24,
          h: 1,
          x: 0,
          y: 9,
          i: 'row-c',
        },
      ];

      layout.onDragStop(
        gridLayout,
        // @ts-expect-error
        {},
        {
          w: 24,
          h: 1,
          x: 0,
          y: 9,
          i: 'row-c',
        },
        {},
        {},
        {}
      );

      //first call is skipped because onDragStop sets _skipOnLayoutChange
      layout.onLayoutChange([]);
      layout.onLayoutChange(gridLayout);

      expect(layout.state.children[0].state.key).toEqual('row-b');
      expect(layout.state.children[1].state.key).toEqual('row-c');
      expect(layout.state.children[2].state.key).toEqual('row-a');
    });

    it('should allow dropping a row at the end of a dashboard, after a uncollapsed row', () => {
      const layout = new SceneGridLayout({
        children: [
          new SceneGridRow({
            title: 'Row B',
            key: 'row-b',
            isCollapsed: false,
            y: 0,
            children: [
              new SceneGridItem({
                key: 'b',
                x: 0,
                y: 1,
                width: 1,
                height: 1,
                isResizable: false,
                isDraggable: false,
                body: new TestObject({}),
              }),
            ],
          }),
          new SceneGridRow({
            title: 'Row A',
            key: 'row-a',
            isCollapsed: true,
            y: 2,
          }),
        ],
        isLazy: false,
      });

      // we save the initial layout here, if a state is invalid we will revert to this layout
      layout.onDragStart(
        [
          {
            w: 24,
            h: 1,
            x: 0,
            y: 0,
            i: 'row-a',
          },
          {
            w: 12,
            h: 8,
            x: 0,
            y: 1,
            i: 'row-b',
          },
          {
            w: 12,
            h: 8,
            x: 0,
            y: 2,
            i: 'b',
          },
        ],
        // @ts-expect-error
        {},
        {},
        {},
        {},
        {}
      );

      // move row-a to be after an uncollapsed row:
      // row-b
      //  - b
      // row-a
      const gridLayout = [
        {
          w: 12,
          h: 8,
          x: 0,
          y: 0,
          i: 'row-b',
        },
        {
          w: 12,
          h: 8,
          x: 0,
          y: 8,
          i: 'b',
        },
        {
          w: 24,
          h: 1,
          x: 0,
          y: 9,
          i: 'row-a',
        },
      ];

      layout.onDragStop(
        gridLayout,
        // @ts-expect-error
        {},
        {
          w: 24,
          h: 1,
          x: 0,
          y: 9,
          i: 'row-a',
        },
        {},
        {},
        {}
      );

      //first call is skipped because onDragStop sets _skipOnLayoutChange
      layout.onLayoutChange([]);
      layout.onLayoutChange(gridLayout);

      expect(layout.state.children[0].state.key).toEqual('row-b');
      expect(layout.state.children[1].state.key).toEqual('row-a');
    });

    it('should allow dropping a row between an uncollapsed row and a grid item that is not part of the row', () => {
      const layout = new SceneGridLayout({
        children: [
          new SceneGridRow({
            title: 'Row B',
            key: 'row-b',
            isCollapsed: false,
            y: 0,
            children: [
              new SceneGridItem({
                key: 'b',
                x: 0,
                y: 1,
                width: 1,
                height: 1,
                isResizable: false,
                isDraggable: false,
                body: new TestObject({}),
              }),
            ],
          }),
          new SceneGridItem({
            key: 'c',
            x: 0,
            y: 2,
            width: 1,
            height: 1,
            isResizable: false,
            isDraggable: false,
            body: new TestObject({}),
          }),
          new SceneGridRow({
            title: 'Row A',
            key: 'row-a',
            isCollapsed: true,
            y: 3,
          }),
        ],
        isLazy: false,
      });

      // we save the initial layout here, if a state is invalid we will revert to this layout
      layout.onDragStart(
        [
          {
            w: 12,
            h: 8,
            x: 0,
            y: 0,
            i: 'row-b',
          },
          {
            w: 12,
            h: 8,
            x: 0,
            y: 1,
            i: 'b',
          },
          {
            w: 24,
            h: 1,
            x: 0,
            y: 2,
            i: 'c',
          },
          {
            w: 24,
            h: 1,
            x: 0,
            y: 3,
            i: 'row-a',
          },
        ],
        // @ts-expect-error
        {},
        {},
        {},
        {},
        {}
      );

      // move row-a to be between an uncollapsed row with a panel and a panel that is not part of that row:
      // row-b
      //  - b
      // row-a
      // c
      const gridLayout = [
        {
          w: 12,
          h: 8,
          x: 0,
          y: 0,
          i: 'row-b',
        },
        {
          w: 12,
          h: 8,
          x: 0,
          y: 8,
          i: 'b',
        },
        {
          w: 24,
          h: 1,
          x: 0,
          y: 9,
          i: 'row-a',
        },
        {
          w: 24,
          h: 1,
          x: 0,
          y: 10,
          i: 'c',
        },
      ];

      layout.onDragStop(
        gridLayout,
        // @ts-expect-error
        {},
        {
          w: 24,
          h: 1,
          x: 0,
          y: 10,
          i: 'c',
        },
        {},
        {},
        {}
      );

      //first call is skipped because onDragStop sets _skipOnLayoutChange
      layout.onLayoutChange([]);
      layout.onLayoutChange(gridLayout);

      expect(layout.state.children[0].state.key).toEqual('row-b');
      expect(layout.state.children[1].state.key).toEqual('row-a');
      expect(layout.state.children[2].state.key).toEqual('c');
    });
  });

  describe('when using rows', () => {
    it('should update objects relations when moving object out of a row', () => {
      const rowAChild1 = new SceneGridItem({
        x: 0,
        y: 1,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        body: new TestObject({ key: 'row-a-child1' }),
      });
      const rowAChild2 = new SceneGridItem({
        x: 1,
        y: 1,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        body: new TestObject({ key: 'row-a-child2' }),
      });

      const sourceRow = new SceneGridRow({
        title: 'Row A',
        key: 'row-a',
        y: 0,
        children: [rowAChild1, rowAChild2],
      });

      const layout = new SceneGridLayout({
        children: [sourceRow],
        isLazy: false,
      });

      const updatedLayout = layout.moveChildTo(rowAChild1, layout);

      expect(updatedLayout.length).toEqual(2);

      // the source row should be cloned and with children updated
      expect(updatedLayout[0].state.key).toEqual(sourceRow.state.key);
      expect(updatedLayout[0]).not.toEqual(sourceRow);
      expect((updatedLayout[0] as SceneGridRow).state.children.length).toEqual(1);
      expect((updatedLayout[0] as SceneGridRow).state.children).not.toContain(rowAChild1);

      // the moved child should be cloned in the root
      expect(updatedLayout[1].state.key).toEqual(rowAChild1.state.key);
      expect(updatedLayout[1]).not.toEqual(rowAChild1);
    });
    it('should update objects relations when moving objects between rows', () => {
      const rowAChild1 = new SceneGridItem({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        key: 'row-a-child1',
        body: new TestObject({}),
      });
      const rowAChild2 = new SceneGridItem({
        x: 1,
        y: 0,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        key: 'row-a-child2',
        body: new TestObject({}),
      });

      const sourceRow = new SceneGridRow({
        title: 'Row A',
        key: 'row-a',
        children: [rowAChild1, rowAChild2],
      });

      const targetRow = new SceneGridRow({
        title: 'Row B',
        key: 'row-b',
        children: [],
      });

      const panelOutsideARow = new SceneGridItem({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        key: 'a',
        body: new TestObject({}),
      });
      const layout = new SceneGridLayout({
        children: [panelOutsideARow, sourceRow, targetRow],
        isLazy: false,
      });

      const updatedLayout = layout.moveChildTo(rowAChild1, targetRow);

      expect(updatedLayout[0]).toEqual(panelOutsideARow);

      // the source row should be cloned and with children updated
      expect(updatedLayout[1].state.key).toEqual(sourceRow.state.key);
      expect(updatedLayout[1]).not.toEqual(sourceRow);
      expect((updatedLayout[1] as SceneGridRow).state.children.length).toEqual(1);

      // the target row should be cloned and with children updated
      expect(updatedLayout[2].state.key).toEqual(targetRow.state.key);
      expect(updatedLayout[2]).not.toEqual(targetRow);
      expect((updatedLayout[2] as SceneGridRow).state.children.length).toEqual(1);

      // the moved object should be cloned and added to the target row
      const movedObject = (updatedLayout[2] as SceneGridRow).state.children[0];
      expect(movedObject.state.key).toEqual('row-a-child1');
      expect(movedObject).not.toEqual(rowAChild1);
    });

    it('should update position of objects when row is expanded', () => {
      const rowAChild1 = new SceneGridItem({
        x: 0,
        // deliberately set higher than the row
        y: 10,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        body: new TestObject({ key: 'row-a-child1' }),
      });

      const rowAChild2 = new SceneGridItem({
        x: 1,
        y: 10,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        body: new TestObject({ key: 'row-a-child2' }),
      });

      const rowA = new SceneGridRow({
        title: 'Row A',
        key: 'row-a',
        children: [rowAChild1, rowAChild2],
        y: 0,
        isCollapsed: true,
      });

      const panelOutsideARow = new SceneGridItem({
        x: 0,
        y: 1,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        body: new TestObject({ key: 'outsider' }),
      });

      const rowBChild1 = new SceneGridItem({
        x: 0,
        y: 3,
        width: 1,
        height: 1,
        isResizable: false,
        isDraggable: false,
        body: new TestObject({ key: 'row-b-child1' }),
      });

      const rowB = new SceneGridRow({
        title: 'Row B',
        key: 'row-b',
        children: [rowBChild1],
        y: 2,
        isCollapsed: false,
      });

      const layout = new SceneGridLayout({
        children: [rowA, panelOutsideARow, rowB],
        isLazy: false,
      });

      layout.toggleRow(rowA);

      // should correct rowA children y position
      expect(rowAChild1.state!.y).toEqual(1);
      expect(rowAChild2.state!.y).toEqual(1);

      expect(panelOutsideARow.state!.y).toEqual(2);
      expect(rowB.state!.y).toEqual(3);
      expect(rowBChild1.state!.y).toEqual(4);
    });
  });
});
