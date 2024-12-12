import { getDefaultTimeRange } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { of } from 'rxjs';
import { SceneObjectBase } from './SceneObjectBase.js';

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
class SceneDataNode extends SceneObjectBase {
  constructor(state) {
    super(__spreadValues({
      data: emptyPanelData
    }, state));
  }
  getResultsStream() {
    const result = {
      origin: this,
      data: this.state.data
    };
    return of(result);
  }
}
const emptyPanelData = {
  state: LoadingState.Done,
  series: [],
  timeRange: getDefaultTimeRange()
};

export { SceneDataNode, emptyPanelData };
//# sourceMappingURL=SceneDataNode.js.map
