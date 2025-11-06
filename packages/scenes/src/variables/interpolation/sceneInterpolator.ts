import { ScopedVars } from '@grafana/data';
import { VariableInterpolation } from '@grafana/runtime';
import { VariableType, VariableFormatID } from '@grafana/schema';

import { SceneObject } from '../../core/types';
import { InterpolationFormatParameter, isCustomVariableValue, VariableValue } from '../types';

import { getSceneVariableForScopedVar } from './ScopedVarsVariable';
import { formatRegistry, FormatVariable } from './formatRegistry';
import { VARIABLE_REGEX } from '../constants';
import { lookupVariable } from '../lookupVariable';
import { macrosIndex } from '../macros';

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
  format?: InterpolationFormatParameter,
  interpolations?: VariableInterpolation[]
): string {
  if (!target || typeof target !== 'string') {
    return target ?? '';
  }

  VARIABLE_REGEX.lastIndex = 0;

  return target.replace(VARIABLE_REGEX, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
    const variableName = var1 || var2 || var3;
    const fmt = fmt2 || fmt3 || format;
    const variable = lookupFormatVariable(variableName, match, scopedVars, sceneObject);

    if (!variable) {
      if (interpolations) {
        // Set `value` equal to `match` as documented in the `VariableInterpolation` interface.
        interpolations.push({ match, variableName, fieldPath, format: fmt, value: match, found: false });
      }
      return match;
    }

    const value = formatValue(sceneObject, variable, variable.getValue(fieldPath), fmt, fieldPath);

    if (interpolations) {
      interpolations.push({ match, variableName, fieldPath, format: fmt, value, found: value !== match });
    }

    return value;
  });
}

function lookupFormatVariable(
  name: string,
  match: string,
  scopedVars: ScopedVars | undefined,
  sceneObject: SceneObject
): FormatVariable | null {
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

function formatValue(
  context: SceneObject,
  variable: FormatVariable,
  value: VariableValue | undefined | null,
  formatNameOrFn?: InterpolationFormatParameter,
  fieldPath?: string
): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Variable can return a custom value that handles formatting
  // This is useful for customAllValue and macros that return values that are already formatted or need special formatting
  if (isCustomVariableValue(value)) {
    return sceneInterpolator(context, value.formatter(formatNameOrFn));
  }

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
    formatNameOrFn = VariableFormatID.Glob;
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
    formatter = formatRegistry.get(VariableFormatID.Glob);
  }

  return formatter.formatter(value, args, variable, fieldPath);
}
