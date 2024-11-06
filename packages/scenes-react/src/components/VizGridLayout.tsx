import { useTheme2 } from '@grafana/ui';
import React, { CSSProperties } from 'react';

export interface Props {
  minWidth?: number;
  minHeight?: number;
  children: React.ReactNode;
}

/**
 * Simple css grid layout for visualizations
 */
export function VizGridLayout({ children, minWidth = 400, minHeight = 320 }: Props) {
  const theme = useTheme2();
  const style: CSSProperties = {
    display: 'grid',
    flexGrow: 1,
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    gridAutoRows: `minmax(${minHeight}px, auto)`,
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(1),
  };

  return <div style={style}>{children}</div>;
}
