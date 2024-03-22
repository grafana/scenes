import { GRID_CELL_HEIGHT, GRID_CELL_VMARGIN } from './constants';
import { fitPanelsInHeight } from './utils';

describe.only('fitPanelsInHeight', () => {
  it('should fit panels to the given height + margins', () => {
    // ---------------
    // | a | b |
    // | a |   |
    // | c     |
    // ---------------
    const cells = [
      { x: 0, y: 0, w: 2, h: 2 },
      { x: 2, y: 0, w: 1, h: 1 },
      { x: 0, y: 2, w: 3, h: 1 },
      // Total height: 4
    ] as ReactGridLayout.Layout[];

    // 3 margins: marging top, margin bottom, and some extra margin at the bottom
    const height = GRID_CELL_HEIGHT * 2 + GRID_CELL_VMARGIN * 3;

    const result = fitPanelsInHeight(cells, height);

    // ---------------
    // | a | b |
    // | c     |
    // ---------------
    expect(result).toEqual([
      { x: 0, y: 0, w: 2, h: 1 },
      { x: 2, y: 0, w: 1, h: 1 },
      { x: 0, y: 1, w: 3, h: 1 },
    ]);
  });

  it('should NOT scale down panels if they fit in the given height', () => {
    // ---------------
    // | a | a | b |
    // | a | a | b |
    // | a | a |   |
    // | a | a |   |
    // | c | c | c |
    // | c | c | c |
    // ---------------
    const cells = [
      { x: 0, y: 0, w: 2, h: 4 },
      { x: 2, y: 0, w: 1, h: 2 },
      { x: 0, y: 4, w: 3, h: 2 },
    ] as ReactGridLayout.Layout[];
    const height = GRID_CELL_HEIGHT * 6 + GRID_CELL_VMARGIN * 4;

    const result = fitPanelsInHeight(cells, height);

    // ---------------
    // | a | a | b |
    // | a | a | b |
    // | a | a |   |
    // | a | a |   |
    // | c | c | c |
    // | c | c | c |
    // ---------------
    expect(result).toEqual([
      { x: 0, y: 0, w: 2, h: 4 },
      { x: 2, y: 0, w: 1, h: 2 },
      { x: 0, y: 4, w: 3, h: 2 },
    ]);
  });
});
