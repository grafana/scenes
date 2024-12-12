import { rangeUtil, dateTime, FieldType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useStyles2, ButtonGroup, ToolbarButton, Checkbox, ButtonSelect } from '@grafana/ui';
import React from 'react';
import { sceneGraph } from '../core/sceneGraph/index.js';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig.js';
import { getCompareSeriesRefId } from '../utils/getCompareSeriesRefId.js';
import { parseUrlParam } from '../utils/parseUrlParam.js';
import { css } from '@emotion/css';
import { of } from 'rxjs';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const PREVIOUS_PERIOD_VALUE = "__previousPeriod";
const NO_PERIOD_VALUE = "__noPeriod";
const PREVIOUS_PERIOD_COMPARE_OPTION = {
  label: "Previous period",
  value: PREVIOUS_PERIOD_VALUE
};
const NO_COMPARE_OPTION = {
  label: "No comparison",
  value: NO_PERIOD_VALUE
};
const DEFAULT_COMPARE_OPTIONS = [
  { label: "Day before", value: "24h" },
  { label: "Week before", value: "1w" },
  { label: "Month before", value: "1M" }
];
class SceneTimeRangeCompare extends SceneObjectBase {
  constructor(state) {
    super(__spreadValues({ compareOptions: DEFAULT_COMPARE_OPTIONS }, state));
    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: ["compareWith"] });
    this._onActivate = () => {
      const sceneTimeRange = sceneGraph.getTimeRange(this);
      this.setState({ compareOptions: this.getCompareOptions(sceneTimeRange.state.value) });
      this._subs.add(
        sceneTimeRange.subscribeToState((timeRange) => {
          const compareOptions = this.getCompareOptions(timeRange.value);
          const stateUpdate = { compareOptions };
          if (Boolean(this.state.compareWith) && !compareOptions.find(({ value }) => value === this.state.compareWith)) {
            stateUpdate.compareWith = PREVIOUS_PERIOD_VALUE;
          }
          this.setState(stateUpdate);
        })
      );
    };
    this.getCompareOptions = (timeRange) => {
      const diffDays = Math.ceil(timeRange.to.diff(timeRange.from));
      const matchIndex = DEFAULT_COMPARE_OPTIONS.findIndex(({ value }) => {
        const intervalInMs = rangeUtil.intervalToMs(value);
        return intervalInMs >= diffDays;
      });
      return [
        NO_COMPARE_OPTION,
        PREVIOUS_PERIOD_COMPARE_OPTION,
        ...DEFAULT_COMPARE_OPTIONS.slice(matchIndex).map(({ label, value }) => ({ label, value }))
      ];
    };
    this.onCompareWithChanged = (compareWith) => {
      if (compareWith === NO_PERIOD_VALUE) {
        this.onClearCompare();
      } else {
        this.setState({ compareWith });
      }
    };
    this.onClearCompare = () => {
      this.setState({ compareWith: void 0 });
    };
    this.addActivationHandler(this._onActivate);
  }
  getExtraQueries(request) {
    const extraQueries = [];
    const compareRange = this.getCompareTimeRange(request.range);
    if (!compareRange) {
      return extraQueries;
    }
    const targets = request.targets.filter((query) => query.timeRangeCompare !== false);
    if (targets.length) {
      extraQueries.push({
        req: __spreadProps(__spreadValues({}, request), {
          targets,
          range: compareRange
        }),
        processor: timeShiftAlignmentProcessor
      });
    }
    return extraQueries;
  }
  shouldRerun(prev, next, queries) {
    return prev.compareWith !== next.compareWith && queries.find((query) => query.timeRangeCompare !== false) !== void 0;
  }
  getCompareTimeRange(timeRange) {
    let compareFrom;
    let compareTo;
    if (this.state.compareWith) {
      if (this.state.compareWith === PREVIOUS_PERIOD_VALUE) {
        const diffMs = timeRange.to.diff(timeRange.from);
        compareFrom = dateTime(timeRange.from).subtract(diffMs);
        compareTo = dateTime(timeRange.to).subtract(diffMs);
      } else {
        compareFrom = dateTime(timeRange.from).subtract(rangeUtil.intervalToMs(this.state.compareWith));
        compareTo = dateTime(timeRange.to).subtract(rangeUtil.intervalToMs(this.state.compareWith));
      }
      return {
        from: compareFrom,
        to: compareTo,
        raw: {
          from: compareFrom,
          to: compareTo
        }
      };
    }
    return void 0;
  }
  getUrlState() {
    return {
      compareWith: this.state.compareWith
    };
  }
  updateFromUrl(values) {
    if (!values.compareWith) {
      return;
    }
    const compareWith = parseUrlParam(values.compareWith);
    if (compareWith) {
      const compareOptions = this.getCompareOptions(sceneGraph.getTimeRange(this).state.value);
      if (compareOptions.find(({ value }) => value === compareWith)) {
        this.setState({
          compareWith
        });
      } else {
        this.setState({
          compareWith: "__previousPeriod"
        });
      }
    }
  }
}
SceneTimeRangeCompare.Component = SceneTimeRangeCompareRenderer;
const timeShiftAlignmentProcessor = (primary, secondary) => {
  const diff = secondary.timeRange.from.diff(primary.timeRange.from);
  secondary.series.forEach((series) => {
    series.refId = getCompareSeriesRefId(series.refId || "");
    series.meta = __spreadProps(__spreadValues({}, series.meta), {
      timeCompare: {
        diffMs: diff,
        isTimeShiftQuery: true
      }
    });
    series.fields.forEach((field) => {
      if (field.type === FieldType.time) {
        field.values = field.values.map((v) => {
          return diff < 0 ? v - diff : v + diff;
        });
      }
      field.config = __spreadProps(__spreadValues({}, field.config), {
        color: {
          mode: "fixed",
          fixedColor: config.theme.palette.gray60
        }
      });
      return field;
    });
  });
  return of(secondary);
};
function SceneTimeRangeCompareRenderer({ model }) {
  var _a;
  const styles = useStyles2(getStyles);
  const { compareWith, compareOptions } = model.useState();
  const [previousCompare, setPreviousCompare] = React.useState(compareWith);
  const previousValue = (_a = compareOptions.find(({ value: value2 }) => value2 === previousCompare)) != null ? _a : PREVIOUS_PERIOD_COMPARE_OPTION;
  const value = compareOptions.find(({ value: value2 }) => value2 === compareWith);
  const enabled = Boolean(value);
  const onClick = () => {
    if (enabled) {
      setPreviousCompare(compareWith);
      model.onClearCompare();
    } else if (!enabled) {
      model.onCompareWithChanged(previousValue.value);
    }
  };
  return /* @__PURE__ */ React.createElement(ButtonGroup, null, /* @__PURE__ */ React.createElement(ToolbarButton, {
    variant: "canvas",
    tooltip: "Enable time frame comparison",
    onClick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    }
  }, /* @__PURE__ */ React.createElement(Checkbox, {
    label: " ",
    value: enabled,
    onClick
  }), "Comparison"), enabled ? /* @__PURE__ */ React.createElement(ButtonSelect, {
    variant: "canvas",
    value,
    options: compareOptions,
    onChange: (v) => {
      model.onCompareWithChanged(v.value);
    }
  }) : /* @__PURE__ */ React.createElement(ToolbarButton, {
    className: styles.previewButton,
    disabled: true,
    variant: "canvas",
    isOpen: false
  }, previousValue.label));
}
function getStyles(theme) {
  return {
    previewButton: css({
      "&:disabled": {
        border: `1px solid ${theme.colors.secondary.border}`,
        color: theme.colors.text.disabled,
        opacity: 1
      }
    })
  };
}

export { DEFAULT_COMPARE_OPTIONS, NO_COMPARE_OPTION, PREVIOUS_PERIOD_COMPARE_OPTION, SceneTimeRangeCompare };
//# sourceMappingURL=SceneTimeRangeCompare.js.map
