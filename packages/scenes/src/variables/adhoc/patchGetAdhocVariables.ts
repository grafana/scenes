import { getTemplateSrv } from '@grafana/runtime';
import { SceneVariableSet } from '../sets/SceneVariableSet';

let originalGetAdHocVariables: any = undefined;

export function patchGetAdhocVariables(sceneObject: SceneVariableSet) {
  const templateSrv: any = getTemplateSrv();
  if (!templateSrv.getAdHocVariables) {
    console.log('Failed to patch getAdHocVariables');
  }

  if (!originalGetAdHocVariables) {
    originalGetAdHocVariables = templateSrv.getAdHocVariables;
  }

  templateSrv.getAdHocVariables = function () {
    if (sceneObject.isActive) {
      console.log('getAdHocVariables', sceneObject);
      return [];
    } else {
      return originalGetAdHocVariables.call(templateSrv);
    }
  }.bind(templateSrv);
}
