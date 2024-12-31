import { VariableSupportType } from '@grafana/data';

const hasLegacyVariableSupport = (datasource) => {
  return Boolean(datasource.metricFindQuery) && !Boolean(datasource.variables);
};
const hasStandardVariableSupport = (datasource) => {
  if (!datasource.variables) {
    return false;
  }
  if (datasource.variables.getType() !== VariableSupportType.Standard) {
    return false;
  }
  const variableSupport = datasource.variables;
  return "toDataQuery" in variableSupport && Boolean(variableSupport.toDataQuery);
};
const hasCustomVariableSupport = (datasource) => {
  if (!datasource.variables) {
    return false;
  }
  if (datasource.variables.getType() !== VariableSupportType.Custom) {
    return false;
  }
  const variableSupport = datasource.variables;
  return "query" in variableSupport && "editor" in variableSupport && Boolean(variableSupport.query) && Boolean(variableSupport.editor);
};
const hasDataSourceVariableSupport = (datasource) => {
  if (!datasource.variables) {
    return false;
  }
  return datasource.variables.getType() === VariableSupportType.Datasource;
};

export { hasCustomVariableSupport, hasDataSourceVariableSupport, hasLegacyVariableSupport, hasStandardVariableSupport };
//# sourceMappingURL=guards.js.map
