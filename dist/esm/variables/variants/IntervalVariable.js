import { rangeUtil } from '@grafana/data';
import { VariableRefresh } from '@grafana/schema';
import { Select } from '@grafana/ui';
import React from 'react';
import { of } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { SceneObjectUrlSyncConfig } from '../../services/SceneObjectUrlSyncConfig.js';
import { AUTO_VARIABLE_VALUE, AUTO_VARIABLE_TEXT } from '../constants.js';
import { SceneVariableValueChangedEvent } from '../types.js';

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
class IntervalVariable extends SceneObjectBase {
  constructor(initialState) {
    super(__spreadValues({
      type: "interval",
      value: "",
      intervals: ["1m", "10m", "30m", "1h", "6h", "12h", "1d", "7d", "14d", "30d"],
      name: "",
      autoStepCount: 30,
      autoMinInterval: "10s",
      autoEnabled: false,
      refresh: VariableRefresh.onTimeRangeChanged
    }, initialState));
    this._onChange = (value) => {
      this.setState({ value: value.value });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    };
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => [this.getKey()] });
  }
  getKey() {
    return `var-${this.state.name}`;
  }
  getUrlState() {
    return { [this.getKey()]: this.state.value };
  }
  updateFromUrl(values) {
    const update = {};
    const val = values[this.getKey()];
    if (typeof val === "string") {
      if (val.startsWith("$__auto_interval_")) {
        update.value = AUTO_VARIABLE_VALUE;
      } else {
        update.value = val;
      }
    }
    this.setState(update);
  }
  getOptionsForSelect() {
    const { value: currentValue, intervals, autoEnabled } = this.state;
    let options = intervals.map((interval) => ({ value: interval, label: interval }));
    if (autoEnabled) {
      options = [{ value: AUTO_VARIABLE_VALUE, label: AUTO_VARIABLE_TEXT }, ...options];
    }
    if (currentValue && !options.some((option) => option.value === currentValue)) {
      options.push({ value: currentValue, label: currentValue });
    }
    return options;
  }
  getValue() {
    const { value, autoStepCount, autoMinInterval } = this.state;
    if (value === AUTO_VARIABLE_VALUE) {
      return this.getAutoRefreshInteval(autoStepCount, autoMinInterval);
    }
    return value;
  }
  getAutoRefreshInteval(autoStepCount, minRefreshInterval) {
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const intervalObject = rangeUtil.calculateInterval(timeRange, autoStepCount, minRefreshInterval);
    return intervalObject.interval;
  }
  validateAndUpdate() {
    const { value, intervals } = this.state;
    let shouldPublish = false;
    if (value === AUTO_VARIABLE_VALUE) {
      shouldPublish = true;
    } else if (!value && intervals.length > 0) {
      const firstOption = intervals[0];
      this.setState({ value: firstOption });
      shouldPublish = true;
    }
    if (shouldPublish) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
    return of({});
  }
}
IntervalVariable.Component = ({ model }) => {
  const { key, value } = model.useState();
  return /* @__PURE__ */ React.createElement(Select, {
    id: key,
    placeholder: "Select value",
    width: "auto",
    value,
    tabSelectsValue: false,
    options: model.getOptionsForSelect(),
    onChange: model._onChange
  });
};

export { IntervalVariable };
//# sourceMappingURL=IntervalVariable.js.map
