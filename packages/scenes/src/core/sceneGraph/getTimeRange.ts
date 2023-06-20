import { DefaultTimeRange } from '../../variables/interpolation/defaults';
import { SceneObject, SceneTimeRangeLike } from '../types';
import { getClosest } from './utils';

/**
 * Will walk up the scene object graph to the closest $timeRange scene object
 */
export function getTimeRange(sceneObject: SceneObject): SceneTimeRangeLike {
  return getClosest(sceneObject, (s) => s.state.$timeRange) ?? DefaultTimeRange;
}
