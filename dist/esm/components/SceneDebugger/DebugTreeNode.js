import { cx, css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

function DebugTreeNode({ node, selectedObject, onSelect }) {
  const styles = useStyles2(getStyles);
  const children = [];
  const isSelected = node === selectedObject;
  node.forEachChild((child) => {
    children.push(
      /* @__PURE__ */ React.createElement(DebugTreeNode, {
        node: child,
        key: child.state.key,
        selectedObject,
        onSelect
      })
    );
  });
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.container
  }, /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.name, isSelected && styles.selected),
    onClick: () => onSelect(node)
  }, node.constructor.name), /* @__PURE__ */ React.createElement("div", {
    className: styles.children
  }, children));
}
function getStyles(theme) {
  return {
    container: css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(0.5),
      flexDirection: "column"
    }),
    name: css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(1),
      fontSize: theme.typography.bodySmall.fontSize,
      cursor: "pointer",
      padding: theme.spacing(0, 1),
      borderRadius: theme.shape.borderRadius(2),
      position: "relative",
      "&:hover": {
        background: theme.colors.background.secondary
      }
    }),
    selected: css({
      "&::before": {
        display: "block",
        content: "' '",
        position: "absolute",
        left: 0,
        width: 4,
        bottom: 2,
        top: 2,
        borderRadius: theme.shape.radius.default,
        backgroundImage: theme.colors.gradients.brandVertical
      }
    }),
    children: css({
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      paddingLeft: theme.spacing(1)
    })
  };
}

export { DebugTreeNode };
//# sourceMappingURL=DebugTreeNode.js.map
