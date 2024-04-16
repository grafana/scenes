import { GRID_CELL_HEIGHT, GRID_CELL_VMARGIN } from './constants';

export function fitPanelsInHeight(cells: ReactGridLayout.Layout[], height: number) {
  // Take into account cell margint top + cell margin bottom + adding some marging at the bottom
  const visibleHeight = height - GRID_CELL_VMARGIN * 4;
  const currentGridHeight = Math.max(...cells.map((cell) => cell.h + cell.y));

  const visibleGridHeight = Math.floor(visibleHeight / (GRID_CELL_HEIGHT + GRID_CELL_VMARGIN));
  const scaleFactor = currentGridHeight / visibleGridHeight;

  return cells.map((cell) => {
    return {
      ...cell,
      y: Math.round(cell.y / scaleFactor) || 0,
      h: Math.round(cell.h / scaleFactor) || 1,
    };
  });
}
