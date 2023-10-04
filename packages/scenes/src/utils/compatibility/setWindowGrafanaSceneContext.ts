import { SceneObject } from '../../core/types';
import { writeSceneLog } from '../writeSceneLog';

/**
 * Adds the scene object to the global window state so that templateSrv in core can interpolate strings using the scene interpolation engine with the scene as scope.
 * This is needed for old datasources that call templateSrv.replace without passing scopedVars. For example in DataSourceAPI.metricFindQuery.
 *
 * This is also used from TimeSrv to access scene time range.
 */
export function setWindowGrafanaSceneContext(activeScene: SceneObject) {
  const prevScene = (window as any).__grafanaSceneContext;

  writeSceneLog('setWindowGrafanaScene', 'set window.__grafanaSceneContext', activeScene);
  (window as any).__grafanaSceneContext = activeScene;

  return () => {
    if ((window as any).__grafanaSceneContext === activeScene) {
      writeSceneLog('setWindowGrafanaScene', 'restore window.__grafanaSceneContext', prevScene);
      (window as any).__grafanaSceneContext = prevScene;
    }
  };
}
