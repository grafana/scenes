import { cx, css } from '@emotion/css';
import React from 'react';
import { useStyles2, Icon } from '@grafana/ui';
import { SceneObjectBase } from '../../../core/SceneObjectBase.js';
import { SceneGridLayout } from './SceneGridLayout.js';
import { GRID_COLUMN_COUNT } from './constants.js';
import { sceneGraph } from '../../../core/sceneGraph/index.js';
import { selectors } from '@grafana/e2e-selectors';
import { VariableDependencyConfig } from '../../../variables/VariableDependencyConfig.js';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
class SceneGridRow extends SceneObjectBase {
  constructor(state) {
    super(__spreadProps(__spreadValues({
      children: state.children || [],
      isCollapsible: state.isCollapsible || true,
      title: state.title || ""
    }, state), {
      x: 0,
      height: 1,
      width: GRID_COLUMN_COUNT
    }));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["title"]
    });
    this.onCollapseToggle = () => {
      if (!this.state.isCollapsible) {
        return;
      }
      this.getGridLayout().toggleRow(this);
    };
  }
  getGridLayout() {
    const layout = this.parent;
    if (!layout || !(layout instanceof SceneGridLayout)) {
      throw new Error("SceneGridRow must be a child of SceneGridLayout");
    }
    return layout;
  }
  getUrlState() {
    return { rowc: this.state.isCollapsed ? "1" : "0" };
  }
  updateFromUrl(values) {
    if (values.rowc == null) {
      return;
    }
    if (values.rowc !== this.getUrlState().rowc) {
      this.onCollapseToggle();
    }
  }
}
SceneGridRow.Component = SceneGridRowRenderer;
function SceneGridRowRenderer({ model }) {
  const styles = useStyles2(getSceneGridRowStyles);
  const { isCollapsible, isCollapsed, title, actions, children } = model.useState();
  const layout = model.getGridLayout();
  const layoutDragClass = layout.getDragClass();
  const isDraggable = layout.isDraggable();
  const count = children ? children.length : 0;
  const panels = count === 1 ? "panel" : "panels";
  return /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.row, isCollapsed && styles.rowCollapsed)
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.rowTitleAndActionsGroup
  }, /* @__PURE__ */ React.createElement("button", {
    onClick: model.onCollapseToggle,
    className: styles.rowTitleButton,
    "aria-label": isCollapsed ? "Expand row" : "Collapse row",
    "data-testid": selectors.components.DashboardRow.title(sceneGraph.interpolate(model, title, void 0, "text"))
  }, isCollapsible && /* @__PURE__ */ React.createElement(Icon, {
    name: isCollapsed ? "angle-right" : "angle-down"
  }), /* @__PURE__ */ React.createElement("span", {
    className: styles.rowTitle,
    role: "heading"
  }, sceneGraph.interpolate(model, title, void 0, "text"))), /* @__PURE__ */ React.createElement("span", {
    className: cx(styles.panelCount, isCollapsed && styles.panelCountCollapsed)
  }, "(", count, " ", panels, ")"), actions && /* @__PURE__ */ React.createElement("div", {
    className: styles.rowActions
  }, /* @__PURE__ */ React.createElement(actions.Component, {
    model: actions
  }))), isDraggable && isCollapsed && /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.dragHandle, layoutDragClass)
  }, /* @__PURE__ */ React.createElement(Icon, {
    name: "draggabledots"
  })));
}
const getSceneGridRowStyles = (theme) => {
  return {
    row: css({
      width: "100%",
      height: "30px",
      display: "flex",
      justifyContent: "space-between",
      gap: theme.spacing(1)
    }),
    rowTitleButton: css({
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      minWidth: 0,
      gap: theme.spacing(1)
    }),
    rowCollapsed: css({
      borderBottom: `1px solid ${theme.colors.border.weak}`
    }),
    rowTitle: css({
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
      flexGrow: 1,
      minWidth: 0
    }),
    collapsedInfo: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      display: "flex",
      alignItems: "center",
      flexGrow: 1
    }),
    rowTitleAndActionsGroup: css({
      display: "flex",
      minWidth: 0,
      "&:hover, &:focus-within": {
        "& > div": {
          opacity: 1
        }
      }
    }),
    rowActions: css({
      display: "flex",
      whiteSpace: "nowrap",
      opacity: 0,
      transition: "200ms opacity ease-in 200ms",
      "&:hover, &:focus-within": {
        opacity: 1
      }
    }),
    dragHandle: css({
      display: "flex",
      padding: theme.spacing(0, 1),
      alignItems: "center",
      justifyContent: "flex-end",
      cursor: "move",
      color: theme.colors.text.secondary,
      "&:hover": {
        color: theme.colors.text.primary
      }
    }),
    panelCount: css({
      whiteSpace: "nowrap",
      paddingLeft: theme.spacing(2),
      color: theme.colors.text.secondary,
      fontStyle: "italic",
      fontSize: theme.typography.size.sm,
      fontWeight: "normal",
      display: "none",
      lineHeight: "30px"
    }),
    panelCountCollapsed: css({
      display: "inline-block"
    })
  };
};

export { SceneGridRow, SceneGridRowRenderer, getSceneGridRowStyles };
//# sourceMappingURL=SceneGridRow.js.map
