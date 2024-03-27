import { GRID_CELL_HEIGHT, GRID_CELL_VMARGIN } from './constants';

export function fitPanelsInHeight(cells: ReactGridLayout.Layout[], height: number) {
  // Take into account cell margint top + cell margin bottom + adding some marging at the bottom
  const visibleHeight = height - GRID_CELL_VMARGIN * 4;
  const currentGridHeight = Math.max(...cells.map((cell) => cell.h + cell.y));

  const visibleGridHeight = Math.floor(visibleHeight / (GRID_CELL_HEIGHT + GRID_CELL_VMARGIN));
  const scaleFactor = currentGridHeight / visibleGridHeight;

  console.log('scaleFactor', scaleFactor);
  console.log('y');
  return cells.map((cell) => {
    console.log('cell.y', cell.y);
    console.log('cell.h', cell.h);
    console.log('Math.round(cell.y / scaleFactor)', Math.round(cell.y / scaleFactor));
    console.log('Math.round(cell.h / scaleFactor)', Math.round(cell.h / scaleFactor));
    return {
      ...cell,
      y: Math.round(cell.y / scaleFactor) || 0,
      h: Math.round(cell.h / scaleFactor) || 1,
    };
  });
}
