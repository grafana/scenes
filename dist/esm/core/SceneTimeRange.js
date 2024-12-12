import { getTimeZone, rangeUtil, toUtc } from '@grafana/data';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig.js';
import { SceneObjectBase } from './SceneObjectBase.js';
import { getClosest } from './sceneGraph/utils.js';
import { parseUrlParam } from '../utils/parseUrlParam.js';
import { evaluateTimeRange } from '../utils/evaluateTimeRange.js';
import { RefreshEvent, locationService } from '@grafana/runtime';
import { isValid } from '../utils/date.js';

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
class SceneTimeRange extends SceneObjectBase {
  constructor(state = {}) {
    var _a;
    const from = state.from && isValid(state.from) ? state.from : "now-6h";
    const to = state.to && isValid(state.to) ? state.to : "now";
    const timeZone = state.timeZone;
    const value = evaluateTimeRange(
      from,
      to,
      timeZone || getTimeZone(),
      state.fiscalYearStartMonth,
      state.UNSAFE_nowDelay
    );
    const refreshOnActivate = (_a = state.refreshOnActivate) != null ? _a : { percent: 10 };
    super(__spreadValues({ from, to, timeZone, value, refreshOnActivate }, state));
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: ["from", "to", "timezone", "time", "time.window"] });
    this.onTimeRangeChange = (timeRange) => {
      const update = {};
      if (typeof timeRange.raw.from === "string") {
        update.from = timeRange.raw.from;
      } else {
        update.from = timeRange.raw.from.toISOString();
      }
      if (typeof timeRange.raw.to === "string") {
        update.to = timeRange.raw.to;
      } else {
        update.to = timeRange.raw.to.toISOString();
      }
      update.value = evaluateTimeRange(
        update.from,
        update.to,
        this.getTimeZone(),
        this.state.fiscalYearStartMonth,
        this.state.UNSAFE_nowDelay
      );
      if (update.from !== this.state.from || update.to !== this.state.to) {
        this._urlSync.performBrowserHistoryAction(() => {
          this.setState(update);
        });
      }
    };
    this.onTimeZoneChange = (timeZone) => {
      this._urlSync.performBrowserHistoryAction(() => {
        this.setState({ timeZone });
      });
    };
    this.onRefresh = () => {
      this.setState({
        value: evaluateTimeRange(
          this.state.from,
          this.state.to,
          this.getTimeZone(),
          this.state.fiscalYearStartMonth,
          this.state.UNSAFE_nowDelay
        )
      });
      this.publishEvent(new RefreshEvent(), true);
    };
    this.addActivationHandler(this._onActivate.bind(this));
  }
  _onActivate() {
    if (!this.state.timeZone) {
      const timeZoneSource = this.getTimeZoneSource();
      if (timeZoneSource !== this) {
        this._subs.add(
          timeZoneSource.subscribeToState((n, p) => {
            if (n.timeZone !== void 0 && n.timeZone !== p.timeZone) {
              this.setState({
                value: evaluateTimeRange(
                  this.state.from,
                  this.state.to,
                  timeZoneSource.getTimeZone(),
                  this.state.fiscalYearStartMonth,
                  this.state.UNSAFE_nowDelay
                )
              });
            }
          })
        );
      }
    }
    if (rangeUtil.isRelativeTimeRange(this.state.value.raw)) {
      this.refreshIfStale();
    }
  }
  refreshIfStale() {
    var _a, _b, _c, _d;
    let ms;
    if (((_b = (_a = this.state) == null ? void 0 : _a.refreshOnActivate) == null ? void 0 : _b.percent) !== void 0) {
      ms = this.calculatePercentOfInterval(this.state.refreshOnActivate.percent);
    }
    if (((_d = (_c = this.state) == null ? void 0 : _c.refreshOnActivate) == null ? void 0 : _d.afterMs) !== void 0) {
      ms = Math.min(this.state.refreshOnActivate.afterMs, ms != null ? ms : Infinity);
    }
    if (ms !== void 0) {
      this.refreshRange(ms);
    }
  }
  getTimeZoneSource() {
    if (!this.parent || !this.parent.parent) {
      return this;
    }
    const source = getClosest(this.parent.parent, (o) => {
      if (o.state.$timeRange && o.state.$timeRange.state.timeZone) {
        return o.state.$timeRange;
      }
      return void 0;
    });
    if (!source) {
      return this;
    }
    return source;
  }
  refreshRange(refreshAfterMs) {
    var _a;
    const value = evaluateTimeRange(
      this.state.from,
      this.state.to,
      (_a = this.state.timeZone) != null ? _a : getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay
    );
    const diff = value.to.diff(this.state.value.to, "milliseconds");
    if (diff >= refreshAfterMs) {
      this.setState({
        value
      });
    }
  }
  calculatePercentOfInterval(percent) {
    const intervalMs = this.state.value.to.diff(this.state.value.from, "milliseconds");
    return Math.ceil(intervalMs / percent);
  }
  getTimeZone() {
    if (this.state.timeZone) {
      return this.state.timeZone;
    }
    const timeZoneSource = this.getTimeZoneSource();
    if (timeZoneSource !== this) {
      return timeZoneSource.state.timeZone;
    }
    return getTimeZone();
  }
  getUrlState() {
    const params = locationService.getSearchObject();
    const urlValues = { from: this.state.from, to: this.state.to };
    if (this.state.timeZone) {
      urlValues.timezone = this.state.timeZone;
    }
    if (params.time && params["time.window"]) {
      urlValues.time = null;
      urlValues["time.window"] = null;
    }
    return urlValues;
  }
  updateFromUrl(values) {
    var _a, _b, _c;
    const update = {};
    let from = parseUrlParam(values.from);
    let to = parseUrlParam(values.to);
    if (values.time && values["time.window"]) {
      const time = Array.isArray(values.time) ? values.time[0] : values.time;
      const timeWindow = Array.isArray(values["time.window"]) ? values["time.window"][0] : values["time.window"];
      const timeRange = getTimeWindow(time, timeWindow);
      if (timeRange.from && isValid(timeRange.from)) {
        from = timeRange.from;
      }
      if (timeRange.to && isValid(timeRange.to)) {
        to = timeRange.to;
      }
    }
    if (from && isValid(from)) {
      update.from = from;
    }
    if (to && isValid(to)) {
      update.to = to;
    }
    if (typeof values.timezone === "string") {
      update.timeZone = values.timezone !== "" ? values.timezone : void 0;
    }
    if (Object.keys(update).length === 0) {
      return;
    }
    update.value = evaluateTimeRange(
      (_a = update.from) != null ? _a : this.state.from,
      (_b = update.to) != null ? _b : this.state.to,
      (_c = update.timeZone) != null ? _c : this.getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay
    );
    return this.setState(update);
  }
}
function getTimeWindow(time, timeWindow) {
  const valueTime = isNaN(Date.parse(time)) ? parseInt(time, 10) : Date.parse(time);
  let timeWindowMs;
  if (timeWindow.match(/^\d+$/) && parseInt(timeWindow, 10)) {
    timeWindowMs = parseInt(timeWindow, 10);
  } else {
    timeWindowMs = rangeUtil.intervalToMs(timeWindow);
  }
  return {
    from: toUtc(valueTime - timeWindowMs / 2).toISOString(),
    to: toUtc(valueTime + timeWindowMs / 2).toISOString()
  };
}

export { SceneTimeRange };
//# sourceMappingURL=SceneTimeRange.js.map
