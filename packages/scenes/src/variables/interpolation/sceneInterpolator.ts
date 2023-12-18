import { ScopedVars } from '@grafana/data';
import { VariableType, VariableFormatID } from '@grafana/schema';

import { SceneObject } from '../../core/types';
import { InterpolationFormatParameter, isCustomVariableValue, VariableValue } from '../types';

import { getSceneVariableForScopedVar } from './ScopedVarsVariable';
import { formatRegistry, FormatVariable } from './formatRegistry';
import { VARIABLE_REGEX } from '../constants';
import { lookupVariable } from '../lookupVariable';
import { macrosIndex } from '../macros';
import { IntervalMacro } from '../macros/timeMacros';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';

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
  format?: InterpolationFormatParameter
): string {
  if (!target) {
    return target ?? '';
  }

  VARIABLE_REGEX.lastIndex = 0;

  return target.replace(VARIABLE_REGEX, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
    const variableName = var1 || var2 || var3;
    const fmt = fmt2 || fmt3 || format;
    const variable = lookupFormatVariable(variableName, match, scopedVars, sceneObject);

    // This condition is handling a special case for Prometheus data source that relies on interval variables interpolation in the backend./
    if (
      variable instanceof IntervalMacro &&
      sceneObject instanceof SceneQueryRunner &&
      sceneObject.state.datasource?.type === 'prometheus'
    ) {
      return match;
    }

    if (!variable) {
      return match;
    }

    return formatValue(variable, variable.getValue(fieldPath), fmt);
  });
}

function lookupFormatVariable(
  name: string,
  match: string,
  scopedVars: ScopedVars | undefined,
  sceneObject: SceneObject
): FormatVariable | null {
  const scopedVar = scopedVars?.[name];

  if (scopedVar) {
    return getSceneVariableForScopedVar(name, scopedVar);
  }

  const variable = lookupVariable(name, sceneObject);
  if (variable) {
    return variable;
  }

  if (macrosIndex[name]) {
    return new macrosIndex[name](name, sceneObject, match, scopedVars);
  }

  return null;
}

function formatValue(
  variable: FormatVariable,
  value: VariableValue | undefined | null,
  formatNameOrFn?: InterpolationFormatParameter
): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Variable can return a custom value that handles formatting
  // This is useful for customAllValue and macros that return values that are already formatted or need special formatting
  if (isCustomVariableValue(value)) {
    return value.formatter(formatNameOrFn);
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

  return formatter.formatter(value, args, variable);
}
