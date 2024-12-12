import { cx, css } from '@emotion/css';
import React from 'react';
import { useStyles2, ToolbarButton, Icon } from '@grafana/ui';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { getSceneGridRowStyles } from './layout/grid/SceneGridRow.js';
import { sceneGraph } from '../core/sceneGraph/index.js';

class NestedScene extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this.onToggle = () => {
      this.setState({
        isCollapsed: !this.state.isCollapsed
      });
    };
    this.onRemove = () => {
      const parent = this.parent;
      if (isSceneLayoutItem(parent)) {
        parent.setState({
          body: void 0
        });
      }
    };
  }
}
NestedScene.Component = NestedSceneRenderer;
function NestedSceneRenderer({ model }) {
  const { title, isCollapsed, canCollapse, canRemove, body, controls } = model.useState();
  const gridRow = useStyles2(getSceneGridRowStyles);
  const styles = useStyles2(getStyles);
  const toolbarControls = (controls != null ? controls : []).map((action) => /* @__PURE__ */ React.createElement(action.Component, {
    key: action.state.key,
    model: action
  }));
  if (canRemove) {
    toolbarControls.push(
      /* @__PURE__ */ React.createElement(ToolbarButton, {
        icon: "times",
        variant: "default",
        onClick: model.onRemove,
        key: "remove-button",
        "aria-label": "Remove scene"
      })
    );
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.wrapper
  }, /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.row, isCollapsed && styles.rowCollapsed)
  }, /* @__PURE__ */ React.createElement("button", {
    onClick: model.onToggle,
    className: gridRow.rowTitleButton,
    "aria-label": isCollapsed ? "Expand scene" : "Collapse scene"
  }, canCollapse && /* @__PURE__ */ React.createElement(Icon, {
    name: isCollapsed ? "angle-right" : "angle-down"
  }), /* @__PURE__ */ React.createElement("span", {
    className: gridRow.rowTitle,
    role: "heading"
  }, sceneGraph.interpolate(model, title, void 0, "text"))), /* @__PURE__ */ React.createElement("div", {
    className: styles.actions
  }, toolbarControls)), !isCollapsed && /* @__PURE__ */ React.createElement(body.Component, {
    model: body
  }));
}
const getStyles = (theme) => ({
  wrapper: css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: theme.spacing(1)
  }),
  row: css({
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing(1)
  }),
  rowCollapsed: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    paddingBottom: theme.spacing(1)
  }),
  actions: css({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
    flexGrow: 1
  })
});
function isSceneLayoutItem(x) {
  return "body" in x.state;
}

export { NestedScene, NestedSceneRenderer };
//# sourceMappingURL=NestedScene.js.map
