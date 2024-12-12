import { urlUtil, dateTimeFormat } from '@grafana/data';
import { getTimeRange } from '../../core/sceneGraph/getTimeRange.js';
import { getData } from '../../core/sceneGraph/sceneGraph.js';
import { SkipFormattingValue } from './types.js';

class UrlTimeRangeMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "url_variable" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    var _a;
    const timeRange = getTimeRange(this._sceneObject);
    const urlState = (_a = timeRange.urlSync) == null ? void 0 : _a.getUrlState();
    return new SkipFormattingValue(urlUtil.toUrlParams(urlState));
  }
  getValueText() {
    return "";
  }
}
class TimeFromAndToMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "time_macro" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    const timeRange = getTimeRange(this._sceneObject);
    if (this.state.name === "__from") {
      return timeRange.state.value.from.valueOf();
    } else {
      return timeRange.state.value.to.valueOf();
    }
  }
  getValueText() {
    const timeRange = getTimeRange(this._sceneObject);
    if (this.state.name === "__from") {
      return dateTimeFormat(timeRange.state.value.from, { timeZone: timeRange.getTimeZone() });
    } else {
      return dateTimeFormat(timeRange.state.value.to, { timeZone: timeRange.getTimeZone() });
    }
  }
}
class TimezoneMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "time_macro" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    const timeRange = getTimeRange(this._sceneObject);
    const timeZone = timeRange.getTimeZone();
    if (timeZone === "browser") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return timeZone;
  }
  getValueText() {
    return this.getValue();
  }
}
class IntervalMacro {
  constructor(name, sceneObject, match) {
    this.state = { name, type: "time_macro", match };
    this._sceneObject = sceneObject;
  }
  getValue() {
    var _a;
    const data = getData(this._sceneObject);
    if (data) {
      const request = (_a = data.state.data) == null ? void 0 : _a.request;
      if (!request) {
        return this.state.match;
      }
      if (this.state.name === "__interval_ms") {
        return request.intervalMs;
      }
      return request.interval;
    }
    return this.state.match;
  }
}

export { IntervalMacro, TimeFromAndToMacro, TimezoneMacro, UrlTimeRangeMacro };
//# sourceMappingURL=timeMacros.js.map
