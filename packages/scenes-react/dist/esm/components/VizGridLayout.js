import { useTheme2 } from '@grafana/ui';
import React from 'react';

function VizGridLayout({ children, minWidth = 400, minHeight = 320 }) {
  const theme = useTheme2();
  const style = {
    display: "grid",
    flexGrow: 1,
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    gridAutoRows: `minmax(${minHeight}px, auto)`,
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(1)
  };
  return /* @__PURE__ */ React.createElement("div", {
    style
  }, children);
}

export { VizGridLayout };
//# sourceMappingURL=VizGridLayout.js.map
