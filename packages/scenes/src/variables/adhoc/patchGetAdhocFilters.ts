import { getDataSourceSrv, getTemplateSrv } from '@grafana/runtime';
import { AdHocVariableFilter } from '@grafana/data';
import { AdHocFiltersVariable, isGroupByFilter } from './AdHocFiltersVariable';
import { interpolate } from '../../core/sceneGraph/sceneGraph';
import { SceneObject } from '../../core/types';

let originalGetAdhocFilters: any = undefined;
export const allActiveFilterSets = new Set<AdHocFiltersVariable>();

export function patchGetAdhocFilters(filterVar: AdHocFiltersVariable) {
  filterVar.addActivationHandler(() => {
    allActiveFilterSets.add(filterVar);
    return () => allActiveFilterSets.delete(filterVar);
  });

  if (originalGetAdhocFilters) {
    return;
  }

  const templateSrv: any = getTemplateSrv();
  if (!templateSrv?.getAdhocFilters) {
    console.log('Failed to patch getAdhocFilters');
    return;
  }

  originalGetAdhocFilters = templateSrv.getAdhocFilters;

  templateSrv.getAdhocFilters = function getAdhocFiltersScenePatch(dsName: string): AdHocVariableFilter[] {
    if (allActiveFilterSets.size === 0) {
      return originalGetAdhocFilters.call(templateSrv, dsName);
    }

    const ds = getDataSourceSrv().getInstanceSettings(dsName);
    if (!ds) {
      return [];
    }

    for (const filter of allActiveFilterSets.values()) {
      if (filter.state.datasource?.uid === ds.uid) {
        return filter.state.filters.filter((f) => !isGroupByFilter(f));
      }
    }

    return [];
  }.bind(templateSrv);
}

/**
 * Walk up the scene graph from sceneObject to find the closest AdHocFiltersVariable
 * whose interpolated datasource UID matches dsUid. Use this when adhoc filters can
 * live at multiple levels in the hierarchy.
 */
export function findClosestAdHocFilterInHierarchy(
  dsUid: string | undefined,
  sceneObject: SceneObject
): AdHocFiltersVariable | undefined {
  const all = findAllAdHocFiltersInHierarchy(dsUid, sceneObject);
  // findAll returns root → leaf; closest is the last entry
  return all.length > 0 ? all[all.length - 1] : undefined;
}

/**
 * Walk up the scene graph from sceneObject and collect every AdHocFiltersVariable
 * whose interpolated datasource UID matches dsUid.
 *
 * Returns variables in root → leaf order (dashboard first, then section). Use this
 * when query-time filter merge should apply parent filters alongside section filters.
 */
export function findAllAdHocFiltersInHierarchy(
  dsUid: string | undefined,
  sceneObject: SceneObject
): AdHocFiltersVariable[] {
  const found: AdHocFiltersVariable[] = [];
  let current: SceneObject | undefined = sceneObject;

  while (current) {
    const variables = current.state.$variables?.state.variables ?? [];
    for (const variable of variables) {
      if (variable instanceof AdHocFiltersVariable && interpolate(variable, variable.state.datasource?.uid) === dsUid) {
        found.push(variable);
      }
    }
    current = current.parent;
  }

  // Walk collected leaf → root; reverse so callers merge root first
  return found.reverse();
}

/**
 * Search the global set of active AdHocFiltersVariables for one whose interpolated
 * datasource UID matches dsUid. Use this when no scene hierarchy context is available.
 */
export function findGlobalAdHocFilterVariableByUid(dsUid: string | undefined): AdHocFiltersVariable | undefined {
  for (const filter of allActiveFilterSets.values()) {
    if (interpolate(filter, filter.state.datasource?.uid) === dsUid) {
      return filter;
    }
  }

  return undefined;
}
