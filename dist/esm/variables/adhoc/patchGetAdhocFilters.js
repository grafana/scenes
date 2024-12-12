import { getTemplateSrv, getDataSourceSrv } from '@grafana/runtime';

let originalGetAdhocFilters = void 0;
let allActiveFilterSets = /* @__PURE__ */ new Set();
function patchGetAdhocFilters(filterVar) {
  filterVar.addActivationHandler(() => {
    allActiveFilterSets.add(filterVar);
    return () => allActiveFilterSets.delete(filterVar);
  });
  if (originalGetAdhocFilters) {
    return;
  }
  const templateSrv = getTemplateSrv();
  if (!(templateSrv == null ? void 0 : templateSrv.getAdhocFilters)) {
    console.log("Failed to patch getAdhocFilters");
    return;
  }
  originalGetAdhocFilters = templateSrv.getAdhocFilters;
  templateSrv.getAdhocFilters = function getAdhocFiltersScenePatch(dsName) {
    var _a;
    if (allActiveFilterSets.size === 0) {
      return originalGetAdhocFilters.call(templateSrv);
    }
    const ds = getDataSourceSrv().getInstanceSettings(dsName);
    if (!ds) {
      return [];
    }
    for (const filter of allActiveFilterSets.values()) {
      if (((_a = filter.state.datasource) == null ? void 0 : _a.uid) === ds.uid) {
        return filter.state.filters;
      }
    }
    return [];
  }.bind(templateSrv);
}
function findActiveAdHocFilterVariableByUid(dsUid) {
  var _a;
  for (const filter of allActiveFilterSets.values()) {
    if (((_a = filter.state.datasource) == null ? void 0 : _a.uid) === dsUid) {
      return filter;
    }
  }
  return void 0;
}

export { findActiveAdHocFilterVariableByUid, patchGetAdhocFilters };
//# sourceMappingURL=patchGetAdhocFilters.js.map
