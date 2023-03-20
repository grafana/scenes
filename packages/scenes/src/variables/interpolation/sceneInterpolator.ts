import { ScopedVars } from '@grafana/data';
import { VariableType } from '@grafana/schema';

import { SceneObject } from '../../core/types';
import { VariableCustomFormatterFn, VariableValue } from '../types';

import { getSceneVariableForScopedVar } from './ScopedVarsVariable';
import { formatRegistry, FormatRegistryID, FormatVariable } from './formatRegistry';
import { VARIABLE_REGEX } from '../constants';
import { lookupVariable } from '../lookupVariable';

/**
 * This function will try to parse and replace any variable expression found in the target string. The sceneObject will be used as the source of variables. It will
 * use the scene graph and walk up the parent tree until it finds the closest variable.
 *
 * ScopedVars should not really be needed much in the new scene architecture as they can be added to the local scene node instead of passed in interpolate function.
 * It is supported here for backward compatibility and some edge cases where adding scoped vars to local scene node is not practical.
 */
export function sceneInterpolator(
  sceneObject: SceneObject,
  target: string | undefined | null,
  scopedVars?: ScopedVars,
  format?: string | VariableCustomFormatterFn
): string {
  if (!target) {
    return target ?? '';
  }

  VARIABLE_REGEX.lastIndex = 0;

  return target.replace(VARIABLE_REGEX, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
    const variableName = var1 || var2 || var3;
    const fmt = fmt2 || fmt3 || format;
    let variable: FormatVariable | undefined | null;

    if (scopedVars && scopedVars[variableName]) {
      variable = getSceneVariableForScopedVar(variableName, scopedVars[variableName]);
    } else {
      variable = lookupVariable(variableName, sceneObject);
    }

    if (!variable) {
      return match;
    }

    return formatValue(variable, variable.getValue(fieldPath), fmt);
  });
}

function formatValue(
  variable: FormatVariable,
  value: VariableValue | undefined | null,
  formatNameOrFn?: string | VariableCustomFormatterFn
): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Special handling for custom values that should not be formatted / escaped
  // This is used by the custom allValue that usually contain wildcards and therefore should not be escaped
  if (typeof value === 'object' && 'isCustomValue' in value && formatNameOrFn !== FormatRegistryID.text) {
    return value.toString();
  }

  // if (isAdHoc(variable) && format !== FormatRegistryID.queryParam) {
  //   return '';
  // }

  // if it's an object transform value to string
  if (!Array.isArray(value) && typeof value === 'object') {
    value = `${value}`;
  }

  if (typeof formatNameOrFn === 'function') {
    return formatNameOrFn(value, {
      name: variable.state.name,
      type: variable.state.type as VariableType,
      multi: variable.state.isMulti,
      includeAll: variable.state.includeAll,
    });
  }

  let args: string[] = [];

  if (!formatNameOrFn) {
    formatNameOrFn = FormatRegistryID.glob;
  } else {
    // some formats have arguments that come after ':' character
    args = formatNameOrFn.split(':');
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
    formatter = formatRegistry.get(FormatRegistryID.glob);
  }

  return formatter.formatter(value, args, variable);
}
