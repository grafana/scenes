import { css } from '@emotion/css';
import { useStyles2, ToolbarButton, Drawer, CustomScrollbar } from '@grafana/ui';
import React, { useState } from 'react';
import { DebugDetails } from './DebugDetails.js';
import { DebugTreeNode } from './DebugTreeNode.js';

function SceneDebugger({ scene }) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ToolbarButton, {
    variant: "canvas",
    icon: "bug",
    onClick: () => setIsOpen(true)
  }), isOpen && /* @__PURE__ */ React.createElement(Drawer, {
    title: "Scene debugger",
    onClose: () => setIsOpen(false),
    size: "lg"
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.panes
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.pane1
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.paneHeading
  }, "Scene graph"), /* @__PURE__ */ React.createElement(CustomScrollbar, {
    autoHeightMin: "100%"
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.treeWrapper
  }, /* @__PURE__ */ React.createElement(DebugTreeNode, {
    node: scene,
    selectedObject,
    onSelect: setSelectedObject
  })))), /* @__PURE__ */ React.createElement("div", {
    className: styles.pane2
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.paneHeading
  }, "Object details"), selectedObject && /* @__PURE__ */ React.createElement(DebugDetails, {
    node: selectedObject
  })))));
}
function getStyles(theme) {
  return {
    panes: css({
      flexGrow: 1,
      display: "flex",
      height: "100%",
      flexDirection: "row",
      marginTop: theme.spacing(-2)
    }),
    pane1: css({
      flexGrow: 0,
      display: "flex",
      height: "100%",
      flexDirection: "column",
      borderRight: `1px solid ${theme.colors.border.weak}`
    }),
    pane2: css({
      flexGrow: 1,
      display: "flex",
      minHeight: "100%",
      flexDirection: "column",
      paddingLeft: theme.spacing(2)
    }),
    treeWrapper: css({
      paddingRight: theme.spacing(2),
      height: "100%",
      marginLeft: theme.spacing(-1)
    }),
    paneHeading: css({
      padding: theme.spacing(1, 0),
      fontWeight: theme.typography.fontWeightMedium
    })
  };
}

export { SceneDebugger };
//# sourceMappingURL=SceneDebugger.js.map
