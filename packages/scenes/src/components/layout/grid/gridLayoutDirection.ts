import type ReactGridLayout from 'react-grid-layout';

import { GRID_COLUMN_COUNT } from './constants';

function mirrorGridItem(item: ReactGridLayout.Layout): ReactGridLayout.Layout {
  return { ...item, x: GRID_COLUMN_COUNT - item.x - item.w };
}

// react-grid-layout measures from the physical left. Convert at the renderer boundary so
// the scene model stores the same column positions in both reading directions.
export function mirrorGridLayout(layout: ReactGridLayout.Layout[]): ReactGridLayout.Layout[] {
  return layout.map(mirrorGridItem);
}

export function mirrorGridCallback(callback: ReactGridLayout.ItemCallback): ReactGridLayout.ItemCallback {
  return (layout, oldItem, newItem, placeholder, event, element) => {
    callback(
      mirrorGridLayout(layout),
      mirrorGridItem(oldItem),
      mirrorGridItem(newItem),
      placeholder && mirrorGridItem(placeholder),
      event,
      element
    );
  };
}
