import { getDataSourceSrv, getTemplateSrv } from '@grafana/runtime';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { sceneGraph } from '../../core/sceneGraph';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { AdHocVariableFilter } from '@grafana/data';

let originalGetAdhocFilters: any = undefined;

export function patchGetAdhocVariables(sceneObject: SceneVariableSet) {
  const templateSrv: any = getTemplateSrv();
  if (!templateSrv.getAdHocVariables) {
    console.log('Failed to patch getAdHocVariables');
  }

  if (!originalGetAdhocFilters) {
    originalGetAdhocFilters = templateSrv.getAdhocFilters;
  }

  templateSrv.getAdhocFilters = function (dsName: string): AdHocVariableFilter[] {
    if (sceneObject.isActive) {
      const variableSet = sceneGraph.getVariables(sceneObject);
      const ds = getDataSourceSrv().getInstanceSettings(dsName);

      if (!ds) {
        return [];
      }

      for (const variable of variableSet.state.variables) {
        if (variable instanceof AdHocFiltersVariable) {
          if (variable.state.datasource?.uid === ds.uid) {
            return variable.state.baseFilters.concat(...variable.state.filters);
          }
        }
      }

      return [];
    } else {
      return originalGetAdhocFilters.call(templateSrv);
    }
  }.bind(templateSrv);
}
