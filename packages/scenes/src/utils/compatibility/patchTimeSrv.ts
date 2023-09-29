import { SceneTimeRangeLike } from '../../core/types';
import { writeSceneLog } from '../writeSceneLog';

/**
 * This function attaches a time range object to global scope, so that TimeSrv in core Grafana can resolve time range correctly.
 * This is a hack to accomodate for core data sources that depend on getTimeSrv().getTimeRange() calls.
 * This function is called from EmbededScene component.
 **/
export function _patchTimeSrv(timeRange: SceneTimeRangeLike) {
  if ((window as any).__timeRangeSceneObject) {
    writeSceneLog('_patchTimeSrv', 'already patched');
    return;
  }
  writeSceneLog('_patchTimeSrv', 'patching');
  (window as any).__timeRangeSceneObject = timeRange;

  return () => {
    writeSceneLog('_patchTimeSrv', 'unpatching');
    delete (window as any).__timeRangeSceneObject;
  };
}
