import { getDataSourceSrv, getTemplateSrv } from '@grafana/runtime';
import { GroupBySet } from './GroupBySet';
import { AdHocVariableFilter } from '@grafana/data';

let originalGetAdhocFilters: any = undefined;
let allActiveFilterSets = new Set<GroupBySet>();

export function patchGetAdhocFilters(filterSet: GroupBySet) {
  filterSet.addActivationHandler(() => {
    allActiveFilterSets.add(filterSet);
    return () => allActiveFilterSets.delete(filterSet);
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
      return originalGetAdhocFilters.call(templateSrv);
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

export function findActiveAdHocFilterSetByUid(dsUid: string | undefined): GroupBySet | undefined {
  for (const filter of allActiveFilterSets.values()) {
    if (filter.state.datasource?.uid === dsUid) {
      return filter;
    }
  }

  return undefined;
}
