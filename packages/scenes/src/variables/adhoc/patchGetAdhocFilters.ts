import { getDataSourceSrv, getTemplateSrv } from '@grafana/runtime';
import { AdHocVariableFilter } from '@grafana/data';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { interpolate } from '../../core/sceneGraph/sceneGraph';

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
        return filter.state.filters;
      }
    }

    return [];
  }.bind(templateSrv);
}

export function findActiveAdHocFilterVariableByUid(dsUid: string | undefined): AdHocFiltersVariable | undefined {
  for (const filter of allActiveFilterSets.values()) {
    if (interpolate(filter, filter.state.datasource?.uid) === dsUid) {
      return filter;
    }
  }

  return undefined;
}
