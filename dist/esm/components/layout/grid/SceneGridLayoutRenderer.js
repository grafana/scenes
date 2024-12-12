import React, { useRef, useEffect } from 'react';
import ReactGridLayout from 'react-grid-layout';
import { GRID_CELL_VMARGIN, GRID_COLUMN_COUNT, GRID_CELL_HEIGHT } from './constants.js';
import { LazyLoader } from '../LazyLoader.js';
import { useStyles2 } from '@grafana/ui';
import { cx, css } from '@emotion/css';
import { useMeasure } from 'react-use';

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
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function SceneGridLayoutRenderer({ model }) {
  const { children, isLazy, isDraggable, isResizable } = model.useState();
  const [outerDivRef, { width, height }] = useMeasure();
  const ref = useRef(null);
  useEffect(() => {
    updateAnimationClass(ref, !!isDraggable);
  }, [isDraggable]);
  validateChildrenSize(children);
  const renderGrid = (width2, height2) => {
    if (!width2 || !height2) {
      return null;
    }
    const layout = model.buildGridLayout(width2, height2);
    return /* @__PURE__ */ React.createElement("div", {
      ref,
      style: { width: `${width2}px`, height: "100%" },
      className: "react-grid-layout"
    }, /* @__PURE__ */ React.createElement(ReactGridLayout, {
      width: width2,
      isDraggable: isDraggable && width2 > 768,
      isResizable: isResizable != null ? isResizable : false,
      containerPadding: [0, 0],
      useCSSTransforms: true,
      margin: [GRID_CELL_VMARGIN, GRID_CELL_VMARGIN],
      cols: GRID_COLUMN_COUNT,
      rowHeight: GRID_CELL_HEIGHT,
      draggableHandle: `.grid-drag-handle-${model.state.key}`,
      draggableCancel: ".grid-drag-cancel",
      layout,
      onDragStart: model.onDragStart,
      onDragStop: model.onDragStop,
      onResizeStop: model.onResizeStop,
      onLayoutChange: model.onLayoutChange,
      isBounded: false,
      resizeHandle: /* @__PURE__ */ React.createElement(ResizeHandle, null)
    }, layout.map((gridItem, index) => /* @__PURE__ */ React.createElement(GridItemWrapper, {
      key: gridItem.i,
      grid: model,
      layoutItem: gridItem,
      index,
      isLazy,
      totalCount: layout.length
    }))));
  };
  return /* @__PURE__ */ React.createElement("div", {
    ref: outerDivRef,
    style: { flex: "1 1 auto", position: "relative", zIndex: 1, width: "100%" }
  }, renderGrid(width, height));
}
const GridItemWrapper = React.forwardRef((props, ref) => {
  var _b;
  const _a = props, { grid, layoutItem, index, totalCount, isLazy, style, onLoad, onChange, children } = _a, divProps = __objRest(_a, ["grid", "layoutItem", "index", "totalCount", "isLazy", "style", "onLoad", "onChange", "children"]);
  const sceneChild = grid.getSceneLayoutChild(layoutItem.i);
  const className = (_b = sceneChild.getClassName) == null ? void 0 : _b.call(sceneChild);
  const innerContent = /* @__PURE__ */ React.createElement(sceneChild.Component, {
    model: sceneChild,
    key: sceneChild.state.key
  });
  if (isLazy) {
    return /* @__PURE__ */ React.createElement(LazyLoader, __spreadProps(__spreadValues({}, divProps), {
      key: sceneChild.state.key,
      "data-griditem-key": sceneChild.state.key,
      className: cx(className, props.className),
      style,
      ref
    }), innerContent, children);
  }
  return /* @__PURE__ */ React.createElement("div", __spreadProps(__spreadValues({}, divProps), {
    ref,
    key: sceneChild.state.key,
    "data-griditem-key": sceneChild.state.key,
    className: cx(className, props.className),
    style
  }), innerContent, children);
});
GridItemWrapper.displayName = "GridItemWrapper";
function validateChildrenSize(children) {
  if (children.some(
    (c) => c.state.height === void 0 || c.state.width === void 0 || c.state.x === void 0 || c.state.y === void 0
  )) {
    throw new Error("All children must have a size specified");
  }
}
function updateAnimationClass(ref, isDraggable, retry) {
  if (ref.current) {
    if (isDraggable) {
      ref.current.classList.add("react-grid-layout--enable-move-animations");
    } else {
      ref.current.classList.remove("react-grid-layout--enable-move-animations");
    }
  } else if (!retry) {
    setTimeout(() => updateAnimationClass(ref, isDraggable, true), 50);
  }
}
const ResizeHandle = React.forwardRef((_a, ref) => {
  var _b = _a, divProps = __objRest(_b, ["handleAxis"]);
  const customCssClass = useStyles2(getResizeHandleStyles);
  return /* @__PURE__ */ React.createElement("div", __spreadProps(__spreadValues({
    ref
  }, divProps), {
    className: `${customCssClass} scene-resize-handle`
  }), /* @__PURE__ */ React.createElement("svg", {
    width: "16px",
    height: "16px",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M21 15L15 21M21 8L8 21",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
});
ResizeHandle.displayName = "ResizeHandle";
function getResizeHandleStyles(theme) {
  return css({
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 999,
    padding: theme.spacing(1.5, 0, 0, 1.5),
    color: theme.colors.border.strong,
    cursor: "se-resize",
    "&:hover": {
      color: theme.colors.text.link
    },
    svg: {
      display: "block"
    },
    ".react-resizable-hide &": {
      display: "none"
    }
  });
}

export { SceneGridLayoutRenderer };
//# sourceMappingURL=SceneGridLayoutRenderer.js.map
