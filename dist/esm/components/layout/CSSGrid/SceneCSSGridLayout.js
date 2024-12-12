import { css } from '@emotion/css';
import React, { useMemo } from 'react';
import { SceneObjectBase } from '../../../core/SceneObjectBase.js';
import { config } from '@grafana/runtime';
import { LazyLoader } from '../LazyLoader.js';

var __defProp = Object.defineProperty;
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
class SceneCSSGridLayout extends SceneObjectBase {
  constructor(state) {
    var _a, _b;
    super(__spreadValues({
      rowGap: 1,
      columnGap: 1,
      templateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
      autoRows: (_a = state.autoRows) != null ? _a : `320px`,
      children: (_b = state.children) != null ? _b : []
    }, state));
  }
  isDraggable() {
    return false;
  }
}
SceneCSSGridLayout.Component = SceneCSSGridLayoutRenderer;
function SceneCSSGridLayoutRenderer({ model }) {
  const { children, isHidden, isLazy } = model.useState();
  const style = useLayoutStyle(model.state);
  if (isHidden) {
    return null;
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: style
  }, children.map((item) => {
    const Component = item.Component;
    if (isLazy) {
      return /* @__PURE__ */ React.createElement(LazyLoader, {
        key: item.state.key,
        className: style
      }, /* @__PURE__ */ React.createElement(Component, {
        key: item.state.key,
        model: item,
        parentState: model.state
      }));
    }
    return /* @__PURE__ */ React.createElement(Component, {
      key: item.state.key,
      model: item,
      parentState: model.state
    });
  }));
}
class SceneCSSGridItem extends SceneObjectBase {
}
SceneCSSGridItem.Component = SceneCSSGridItemRenderer;
function SceneCSSGridItemRenderer({ model, parentState }) {
  if (!parentState) {
    throw new Error("SceneCSSGridItem must be a child of SceneCSSGridLayout");
  }
  const { body, isHidden } = model.useState();
  const style = useItemStyle(model.state);
  if (!body || isHidden) {
    return null;
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: style
  }, /* @__PURE__ */ React.createElement(body.Component, {
    model: body
  }));
}
function useLayoutStyle(state) {
  return useMemo(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const style = {};
    const theme = config.theme2;
    style.display = "grid";
    style.gridTemplateColumns = state.templateColumns;
    style.gridTemplateRows = state.templateRows || "unset";
    style.gridAutoRows = state.autoRows || "unset";
    style.rowGap = theme.spacing((_a = state.rowGap) != null ? _a : 1);
    style.columnGap = theme.spacing((_b = state.columnGap) != null ? _b : 1);
    style.justifyItems = state.justifyItems || "unset";
    style.alignItems = state.alignItems || "unset";
    style.justifyContent = state.justifyContent || "unset";
    style.flexGrow = 1;
    if (state.md) {
      style[theme.breakpoints.down("md")] = {
        gridTemplateRows: (_c = state.md) == null ? void 0 : _c.templateRows,
        gridTemplateColumns: (_d = state.md) == null ? void 0 : _d.templateColumns,
        rowGap: state.md.rowGap ? theme.spacing((_f = (_e = state.md) == null ? void 0 : _e.rowGap) != null ? _f : 1) : void 0,
        columnGap: state.md.columnGap ? theme.spacing((_h = (_g = state.md) == null ? void 0 : _g.rowGap) != null ? _h : 1) : void 0,
        justifyItems: (_i = state.md) == null ? void 0 : _i.justifyItems,
        alignItems: (_j = state.md) == null ? void 0 : _j.alignItems,
        justifyContent: (_k = state.md) == null ? void 0 : _k.justifyContent
      };
    }
    return css(style);
  }, [state]);
}
function useItemStyle(state) {
  return useMemo(() => {
    const style = {};
    style.gridColumn = state.gridColumn || "unset";
    style.gridRow = state.gridRow || "unset";
    style.position = "relative";
    return css(style);
  }, [state]);
}

export { SceneCSSGridItem, SceneCSSGridLayout };
//# sourceMappingURL=SceneCSSGridLayout.js.map
