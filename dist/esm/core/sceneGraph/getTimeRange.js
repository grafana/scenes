import { DefaultTimeRange } from '../../variables/interpolation/defaults.js';
import { getClosest } from './utils.js';

function getTimeRange(sceneObject) {
  var _a;
  return (_a = getClosest(sceneObject, (s) => s.state.$timeRange)) != null ? _a : DefaultTimeRange;
}

export { getTimeRange };
//# sourceMappingURL=getTimeRange.js.map
