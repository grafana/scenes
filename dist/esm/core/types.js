function isSceneObject(obj) {
  return obj.useState !== void 0;
}
function isDataRequestEnricher(obj) {
  return "enrichDataRequest" in obj;
}
function isFiltersRequestEnricher(obj) {
  return "enrichFiltersRequest" in obj;
}
function isDataLayer(obj) {
  return "isDataLayer" in obj;
}

export { isDataLayer, isDataRequestEnricher, isFiltersRequestEnricher, isSceneObject };
//# sourceMappingURL=types.js.map
