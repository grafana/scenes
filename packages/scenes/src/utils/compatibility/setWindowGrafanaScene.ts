import { SceneObject } from '../../core/types';
import { writeSceneLog } from '../writeSceneLog';

/**
 * Adds the scene object to the global state window state so that templateSrv in core can interpolate strings using the scene interpolation engine with the correct SceneObject scope.
 * This is needed for old data sources that call templateSrv.replace without passing scopedVars. For example in DataSourceAPI.metricFindQuery.
 */
export function setWindowGrafanaScene(activeScene: SceneObject) {
  const prevScene = (window as any).__grafanaScene;

  writeSceneLog('setWindowGrafanaScene', 'set window.__grafanaScene', activeScene);
  (window as any).__grafanaScene = activeScene;

  return () => {
    if ((window as any).__grafanaScene === activeScene) {
      writeSceneLog('setWindowGrafanaScene', 'restore window.__grafanaScene', prevScene);
      (window as any).__grafanaScene = prevScene;
    }
  };
}
