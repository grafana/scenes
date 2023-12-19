import { SceneAppPage, SceneObject } from '@grafana/scenes';
import { DynamicApp } from './DynamicApp';

export interface AppSettings {
  initialDataSource?: string;
  showPanelDescriptions?: boolean;
  isConfigured?: boolean;
}

export function getDynamicApp(model: SceneObject): DynamicApp {
  let obj = model;

  while (true) {
    if (obj.parent) {
      obj = obj.parent;
    } else if (obj instanceof SceneAppPage && obj.state.getParentPage) {
      obj = obj.state.getParentPage();
    } else {
      break;
    }
  }

  if (obj.state.$behaviors?.[0] instanceof DynamicApp) {
    return obj.state.$behaviors?.[0];
  }

  throw new Error('DynamicApp behavior not found at scene app root');
}
