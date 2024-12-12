const allActiveGroupByVariables = /* @__PURE__ */ new Set();
function findActiveGroupByVariablesByUid(dsUid) {
  var _a;
  for (const groupByVariable of allActiveGroupByVariables.values()) {
    if (((_a = groupByVariable.state.datasource) == null ? void 0 : _a.uid) === dsUid) {
      return groupByVariable;
    }
  }
  return void 0;
}

export { allActiveGroupByVariables, findActiveGroupByVariablesByUid };
//# sourceMappingURL=findActiveGroupByVariablesByUid.js.map
