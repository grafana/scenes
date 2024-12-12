import React, { useState, useRef, useImperativeHandle } from 'react';
import { useEffectOnce } from 'react-use';
import { uniqueId } from 'lodash';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';

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
function useUniqueId() {
  var _a;
  const idRefLazy = useRef(void 0);
  (_a = idRefLazy.current) != null ? _a : idRefLazy.current = uniqueId();
  return idRefLazy.current;
}
const LazyLoader = React.forwardRef(
  (_a, ref) => {
    var _b = _a, { children, onLoad, onChange, className } = _b, rest = __objRest(_b, ["children", "onLoad", "onChange", "className"]);
    const id = useUniqueId();
    const { hideEmpty } = useStyles2(getStyles);
    const [loaded, setLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const innerRef = useRef(null);
    useImperativeHandle(ref, () => innerRef.current);
    useEffectOnce(() => {
      LazyLoader.addCallback(id, (entry) => {
        if (!loaded && entry.isIntersecting) {
          setLoaded(true);
          onLoad == null ? void 0 : onLoad();
        }
        setIsInView(entry.isIntersecting);
        onChange == null ? void 0 : onChange(entry.isIntersecting);
      });
      const wrapperEl = innerRef.current;
      if (wrapperEl) {
        LazyLoader.observer.observe(wrapperEl);
      }
      return () => {
        wrapperEl && LazyLoader.observer.unobserve(wrapperEl);
        delete LazyLoader.callbacks[id];
        if (Object.keys(LazyLoader.callbacks).length === 0) {
          LazyLoader.observer.disconnect();
        }
      };
    });
    const classes = `${loaded ? hideEmpty : ""} ${className}`;
    return /* @__PURE__ */ React.createElement("div", __spreadValues({
      id,
      ref: innerRef,
      className: classes
    }, rest), loaded && (typeof children === "function" ? children({ isInView }) : children));
  }
);
function getStyles() {
  return {
    hideEmpty: css({
      "&:empty": {
        display: "none"
      }
    })
  };
}
LazyLoader.displayName = "LazyLoader";
LazyLoader.callbacks = {};
LazyLoader.addCallback = (id, c) => LazyLoader.callbacks[id] = c;
LazyLoader.observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (typeof LazyLoader.callbacks[entry.target.id] === "function") {
        LazyLoader.callbacks[entry.target.id](entry);
      }
    }
  },
  { rootMargin: "100px" }
);

export { LazyLoader, useUniqueId };
//# sourceMappingURL=LazyLoader.js.map
