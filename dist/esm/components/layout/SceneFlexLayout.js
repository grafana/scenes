import { css } from '@emotion/css';
import { config } from '@grafana/runtime';
import React, { useMemo } from 'react';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';

class SceneFlexLayout extends SceneObjectBase {
  toggleDirection() {
    this.setState({
      direction: this.state.direction === "row" ? "column" : "row"
    });
  }
  isDraggable() {
    return false;
  }
}
SceneFlexLayout.Component = SceneFlexLayoutRenderer;
function SceneFlexLayoutRenderer({ model, parentState }) {
  const { children, isHidden } = model.useState();
  const style = useLayoutStyle(model.state, parentState);
  if (isHidden) {
    return null;
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: style
  }, children.map((item) => {
    const Component = item.Component;
    return /* @__PURE__ */ React.createElement(Component, {
      key: item.state.key,
      model: item,
      parentState: model.state
    });
  }));
}
class SceneFlexItem extends SceneObjectBase {
}
SceneFlexItem.Component = SceneFlexItemRenderer;
function SceneFlexItemRenderer({ model, parentState }) {
  if (!parentState) {
    throw new Error("SceneFlexItem must be a child of SceneFlexLayout");
  }
  const { body, isHidden } = model.useState();
  const style = useLayoutItemStyle(model.state, parentState);
  if (!body || isHidden) {
    return null;
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: style
  }, /* @__PURE__ */ React.createElement(body.Component, {
    model: body
  }));
}
function applyItemStyles(style, state, parentState) {
  var _a, _b, _c;
  const parentDirection = (_a = parentState.direction) != null ? _a : "row";
  const { xSizing = "fill", ySizing = "fill" } = state;
  style.display = "flex";
  style.position = "relative";
  style.flexDirection = parentDirection;
  if (parentDirection === "column") {
    if (state.height) {
      style.height = state.height;
    } else {
      style.flexGrow = ySizing === "fill" ? 1 : 0;
    }
    if (state.width) {
      style.width = state.width;
    } else {
      style.alignSelf = xSizing === "fill" ? "stretch" : "flex-start";
    }
  } else {
    if (state.height) {
      style.height = state.height;
    } else {
      style.alignSelf = ySizing === "fill" ? "stretch" : "flex-start";
    }
    if (state.width) {
      style.width = state.width;
    } else {
      style.flexGrow = xSizing === "fill" ? 1 : 0;
    }
  }
  style.minWidth = state.minWidth;
  style.maxWidth = state.maxWidth;
  style.maxHeight = state.maxHeight;
  style.minHeight = (_b = state.minHeight) != null ? _b : parentState.minHeight;
  style.height = (_c = state.height) != null ? _c : parentState.height;
  return style;
}
function useLayoutItemStyle(state, parentState) {
  return useMemo(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const theme = config.theme2;
    const style = applyItemStyles({}, state, parentState);
    style[theme.breakpoints.down("md")] = {
      maxWidth: (_b = (_a = state.md) == null ? void 0 : _a.maxWidth) != null ? _b : "unset",
      maxHeight: (_d = (_c = state.md) == null ? void 0 : _c.maxHeight) != null ? _d : "unset",
      height: (_g = (_e = state.md) == null ? void 0 : _e.height) != null ? _g : (_f = parentState.md) == null ? void 0 : _f.height,
      width: (_j = (_h = state.md) == null ? void 0 : _h.width) != null ? _j : (_i = parentState.md) == null ? void 0 : _i.width
    };
    return css(style);
  }, [state, parentState]);
}
function useLayoutStyle(state, parentState) {
  return useMemo(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const { direction = "row", wrap } = state;
    const theme = config.theme2;
    const style = {};
    if (parentState) {
      applyItemStyles(style, state, parentState);
    } else {
      style.display = "flex";
      style.flexGrow = 1;
      style.minWidth = state.minWidth;
      style.minHeight = state.minHeight;
    }
    style.flexDirection = direction;
    style.gap = "8px";
    style.flexWrap = wrap || "nowrap";
    style.alignContent = "baseline";
    style.minWidth = style.minWidth || 0;
    style.minHeight = style.minHeight || 0;
    style[theme.breakpoints.down("md")] = {
      flexDirection: (_b = (_a = state.md) == null ? void 0 : _a.direction) != null ? _b : "column",
      maxWidth: (_d = (_c = state.md) == null ? void 0 : _c.maxWidth) != null ? _d : "unset",
      maxHeight: (_f = (_e = state.md) == null ? void 0 : _e.maxHeight) != null ? _f : "unset",
      height: (_h = (_g = state.md) == null ? void 0 : _g.height) != null ? _h : "unset",
      width: (_j = (_i = state.md) == null ? void 0 : _i.width) != null ? _j : "unset"
    };
    return css(style);
  }, [parentState, state]);
}

export { SceneFlexItem, SceneFlexLayout };
//# sourceMappingURL=SceneFlexLayout.js.map
