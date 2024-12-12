import { VariableFormatID } from '@grafana/schema';
import { isCustomVariableValue } from '../types.js';
import { getSceneVariableForScopedVar } from './ScopedVarsVariable.js';
import { formatRegistry } from './formatRegistry.js';
import { VARIABLE_REGEX } from '../constants.js';
import { lookupVariable } from '../lookupVariable.js';
import { macrosIndex } from '../macros/index.js';

function sceneInterpolator(sceneObject, target, scopedVars, format, interpolations) {
  if (!target || typeof target !== "string") {
    return target != null ? target : "";
  }
  VARIABLE_REGEX.lastIndex = 0;
  return target.replace(VARIABLE_REGEX, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
    const variableName = var1 || var2 || var3;
    const fmt = fmt2 || fmt3 || format;
    const variable = lookupFormatVariable(variableName, match, scopedVars, sceneObject);
    if (!variable) {
      if (interpolations) {
        interpolations.push({ match, variableName, fieldPath, format: fmt, value: match, found: false });
      }
      return match;
    }
    const value = formatValue(sceneObject, variable, variable.getValue(fieldPath), fmt);
    if (interpolations) {
      interpolations.push({ match, variableName, fieldPath, format: fmt, value, found: value !== match });
    }
    return value;
  });
}
function lookupFormatVariable(name, match, scopedVars, sceneObject) {
  if (scopedVars && scopedVars.hasOwnProperty(name)) {
    const scopedVar = scopedVars[name];
    if (scopedVar) {
      return getSceneVariableForScopedVar(name, scopedVar);
    }
  }
  const variable = lookupVariable(name, sceneObject);
  if (variable) {
    return variable;
  }
  const Macro = macrosIndex.get(name);
  if (Macro) {
    return new Macro(name, sceneObject, match, scopedVars);
  }
  return null;
}
function formatValue(context, variable, value, formatNameOrFn) {
  if (value === null || value === void 0) {
    return "";
  }
  if (isCustomVariableValue(value)) {
    return sceneInterpolator(context, value.formatter(formatNameOrFn));
  }
  if (!Array.isArray(value) && typeof value === "object") {
    value = `${value}`;
  }
  if (typeof formatNameOrFn === "function") {
    return formatNameOrFn(value, {
      name: variable.state.name,
      type: variable.state.type,
      multi: variable.state.isMulti,
      includeAll: variable.state.includeAll
    });
  }
  let args = [];
  if (!formatNameOrFn) {
    formatNameOrFn = VariableFormatID.Glob;
  } else {
    args = formatNameOrFn.split(":");
    if (args.length > 1) {
      formatNameOrFn = args[0];
      args = args.slice(1);
    } else {
      args = [];
    }
  }
  let formatter = formatRegistry.getIfExists(formatNameOrFn);
  if (!formatter) {
    console.error(`Variable format ${formatNameOrFn} not found. Using glob format as fallback.`);
    formatter = formatRegistry.get(VariableFormatID.Glob);
  }
  return formatter.formatter(value, args, variable);
}

export { sceneInterpolator };
//# sourceMappingURL=sceneInterpolator.js.map
