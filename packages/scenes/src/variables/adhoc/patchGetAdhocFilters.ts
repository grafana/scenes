import { getTemplateSrv } from '@grafana/runtime';
import { getDataSourceInstanceList, getDefaultDataSourceInstanceListItem } from '@grafana/plugin-compat/datasources';
import { AdHocVariableFilter } from '@grafana/data';
import { AdHocFiltersVariable, isGroupByFilter } from './AdHocFiltersVariable';
import { interpolate } from '../../core/sceneGraph/sceneGraph';
import { SceneObject } from '../../core/types';

let originalGetAdhocFilters: any = undefined;
export const allActiveFilterSets = new Set<AdHocFiltersVariable>();

// templateSrv.getAdhocFilters is synchronous and may be called with a data source name or "default", while data source
// lookups are async. The name and default flag are resolved when the variable activates or its data source changes,
// until then only uids can be matched. Only the data source list is needed for this, so no per-data-source settings
// are loaded. Template variable uids are not resolved, so those are matched by uid only.
// refUid is the uid the variable had when this was resolved, so an entry for a previous data source is never used.
const resolvedDataSources = new WeakMap<AdHocFiltersVariable, { refUid: string; name: string; isDefault: boolean }>();

async function resolveDataSource(filterVar: AdHocFiltersVariable) {
  const uid = filterVar.state.datasource?.uid;
  if (!uid) {
    return;
  }

  try {
    const items = await getDataSourceInstanceList({ all: true });
    const item = items.find((listItem) => listItem.uid === uid);
    if (!item) {
      return;
    }

    const defaultItem = await getDefaultDataSourceInstanceListItem(items);

    // If the data source changes again before this resolves, a slower earlier lookup can overwrite the newer result.
    // The entry then won't match the current data source, so names are not matched until the next change or activation.
    resolvedDataSources.set(filterVar, { refUid: uid, name: item.name, isDefault: defaultItem?.uid === item.uid });
  } catch (error) {
    console.error('Failed to resolve the data source of an ad hoc filters variable', error);
  }
}

function isFilterSetForDataSource(filterVar: AdHocFiltersVariable, dsName: string | undefined): boolean {
  const uid = filterVar.state.datasource?.uid;
  if (!uid) {
    return false;
  }

  if (uid === dsName) {
    return true;
  }

  // The settings are stale until the new data source is resolved after a change
  const resolved = resolvedDataSources.get(filterVar);
  if (resolved?.refUid !== uid) {
    return false;
  }

  if (!dsName || dsName === 'default') {
    return resolved.isDefault;
  }

  return resolved.name === dsName;
}

export function patchGetAdhocFilters(filterVar: AdHocFiltersVariable) {
  filterVar.addActivationHandler(() => {
    allActiveFilterSets.add(filterVar);
    resolveDataSource(filterVar);

    const sub = filterVar.subscribeToState((state, prevState) => {
      if (state.datasource?.uid !== prevState.datasource?.uid) {
        resolveDataSource(filterVar);
      }
    });

    return () => {
      allActiveFilterSets.delete(filterVar);
      sub.unsubscribe();
    };
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
    for (const filter of allActiveFilterSets.values()) {
      if (isFilterSetForDataSource(filter, dsName)) {
        return filter.state.filters.filter((f) => !isGroupByFilter(f));
      }
    }

    return originalGetAdhocFilters.call(templateSrv, dsName);
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
