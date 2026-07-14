import { DataSourceRef } from '@grafana/schema';

import { sceneGraph } from '../core/sceneGraph';
import { SceneObject } from '../core/types';

/**
 * Parses a simple templated datasource UID (`$ds` or `${ds}`) into the variable name.
 * Returns undefined for non-template UIDs or unsupported formats.
 */
export function getSimpleVariableNameFromDatasourceUid(uid: string | undefined): string | undefined {
  if (!uid) {
    return undefined;
  }
  const shortMatch = uid.match(/^\$([A-Za-z0-9_]+)$/);
  if (shortMatch) {
    return shortMatch[1];
  }

  const bracketMatch = uid.match(/^\$\{([A-Za-z0-9_]+)\}$/);
  if (bracketMatch) {
    return bracketMatch[1];
  }

  return undefined;
}

/**
 * Selected datasource UIDs for a named variable, excluding the sentinel `default`.
 * Returns undefined when the variable is missing or has no value yet.
 */
export function getDatasourceVariableSelectedUids(
  sceneObject: SceneObject,
  variableName: string
): string[] | undefined {
  const variable = sceneGraph.lookupVariable(variableName, sceneObject);
  if (!variable) {
    return undefined;
  }

  const value = variable.getValue();
  if (Array.isArray(value)) {
    return value.filter((item) => item !== 'default').map(String);
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  if (value === 'default') {
    return [];
  }

  return [String(value)];
}

export function getDatasourceVariableSelectionCount(
  sceneObject: SceneObject,
  variableName: string
): number | undefined {
  const uids = getDatasourceVariableSelectedUids(sceneObject, variableName);
  return uids?.length;
}

/**
 * When `datasource` is a multi-value template variable with more than one selected UID,
 * returns those concrete UIDs for fan-out. Otherwise returns undefined so the caller
 * keeps the normal single getDataSource path (including first-value interpolation).
 */
export function expandMultiValueDatasourceUids(
  sceneObject: SceneObject,
  datasource: DataSourceRef | null | undefined
): string[] | undefined {
  const variableName = getSimpleVariableNameFromDatasourceUid(datasource?.uid);
  if (!variableName) {
    return undefined;
  }

  const uids = getDatasourceVariableSelectedUids(sceneObject, variableName);
  if (!uids || uids.length <= 1) {
    return undefined;
  }

  return uids;
}
