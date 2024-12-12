import React from 'react';
import { useLocation } from 'react-router-dom';
import { urlUtil, locationUtil } from '@grafana/data';
import { locationSearchToObject } from '@grafana/runtime';

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
function useAppQueryParams() {
  const location = useLocation();
  return locationSearchToObject(location.search || "");
}
function getUrlWithAppState(path, searchObject, preserveParams) {
  const paramsCopy = __spreadValues({}, searchObject);
  if (preserveParams) {
    for (const key of Object.keys(paramsCopy)) {
      if (!preserveParams.includes(key)) {
        delete paramsCopy[key];
      }
    }
  }
  return urlUtil.renderUrl(locationUtil.assureBaseUrl(path), paramsCopy);
}
function renderSceneComponentWithRouteProps(sceneObject, routeProps) {
  return React.createElement(sceneObject.Component, { model: sceneObject, routeProps });
}

export { getUrlWithAppState, renderSceneComponentWithRouteProps, useAppQueryParams };
//# sourceMappingURL=utils.js.map
