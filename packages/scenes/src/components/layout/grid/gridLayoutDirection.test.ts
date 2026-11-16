import { mirrorGridCallback, mirrorGridLayout } from './gridLayoutDirection';

describe('RTL grid coordinates', () => {
  it('mirrors unequal columns and leaves full-width rows in place', () => {
    const layout = [
      { i: 'first', x: 0, y: 1, w: 7, h: 6 },
      { i: 'second', x: 14, y: 1, w: 10, h: 6 },
      { i: 'row', x: 0, y: 0, w: 24, h: 1, isResizable: false },
    ];

    expect(mirrorGridLayout(layout)).toEqual([
      { i: 'first', x: 17, y: 1, w: 7, h: 6 },
      { i: 'second', x: 0, y: 1, w: 10, h: 6 },
      { i: 'row', x: 0, y: 0, w: 24, h: 1, isResizable: false },
    ]);
    expect(layout[0].x).toBe(0);
  });

  it('commits logical coordinates after a move or southwest resize', () => {
    const commit = jest.fn();
    const callback = mirrorGridCallback(commit);
    const oldItem = { i: 'panel', x: 17, y: 0, w: 7, h: 6 };
    const newItem = { i: 'panel', x: 14, y: 0, w: 8, h: 6 };
    const event = new MouseEvent('mouseup');
    const element = document.createElement('div');

    callback([newItem], oldItem, newItem, newItem, event, element);

    const saved = { i: 'panel', x: 2, y: 0, w: 8, h: 6 };
    expect(commit).toHaveBeenCalledWith([saved], { i: 'panel', x: 0, y: 0, w: 7, h: 6 }, saved, saved, event, element);
  });
});
