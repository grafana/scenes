import React from 'react';
import { useLocalStorage } from 'react-use';
import { uniqBy } from 'lodash';
import { toUtc, rangeUtil, isDateTime } from '@grafana/data';
import { TimeRangePicker } from '@grafana/ui';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { sceneGraph } from '../core/sceneGraph/index.js';

class SceneTimePicker extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this.onZoom = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const zoomedTimeRange = getZoomedTimeRange(timeRange.state.value, 2);
      timeRange.onTimeRangeChange(zoomedTimeRange);
    };
    this.onChangeFiscalYearStartMonth = (month) => {
      const timeRange = sceneGraph.getTimeRange(this);
      timeRange.setState({ fiscalYearStartMonth: month });
    };
    this.toAbsolute = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const timeRangeVal = timeRange.state.value;
      const from = toUtc(timeRangeVal.from);
      const to = toUtc(timeRangeVal.to);
      timeRange.onTimeRangeChange({ from, to, raw: { from, to } });
    };
    this.onMoveBackward = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const {
        state: { value: range }
      } = timeRange;
      timeRange.onTimeRangeChange(getShiftedTimeRange(TimeRangeDirection.Backward, range, Date.now()));
    };
    this.onMoveForward = () => {
      const timeRange = sceneGraph.getTimeRange(this);
      const {
        state: { value: range }
      } = timeRange;
      timeRange.onTimeRangeChange(getShiftedTimeRange(TimeRangeDirection.Forward, range, Date.now()));
    };
  }
}
SceneTimePicker.Component = SceneTimePickerRenderer;
function SceneTimePickerRenderer({ model }) {
  const { hidePicker, isOnCanvas } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeZone = timeRange.getTimeZone();
  const timeRangeState = timeRange.useState();
  const [timeRangeHistory, setTimeRangeHistory] = useLocalStorage(HISTORY_LOCAL_STORAGE_KEY, [], {
    raw: false,
    serializer: serializeHistory,
    deserializer: deserializeHistory
  });
  if (hidePicker) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(TimeRangePicker, {
    isOnCanvas: isOnCanvas != null ? isOnCanvas : true,
    value: timeRangeState.value,
    onChange: (range) => {
      if (isAbsolute(range)) {
        setTimeRangeHistory([range, ...timeRangeHistory != null ? timeRangeHistory : []]);
      }
      timeRange.onTimeRangeChange(range);
    },
    timeZone,
    fiscalYearStartMonth: timeRangeState.fiscalYearStartMonth,
    onMoveBackward: model.onMoveBackward,
    onMoveForward: model.onMoveForward,
    onZoom: model.onZoom,
    onChangeTimeZone: timeRange.onTimeZoneChange,
    onChangeFiscalYearStartMonth: model.onChangeFiscalYearStartMonth,
    weekStart: timeRangeState.weekStart,
    history: timeRangeHistory
  });
}
function getZoomedTimeRange(timeRange, factor) {
  const timespan = timeRange.to.valueOf() - timeRange.from.valueOf();
  const center = timeRange.to.valueOf() - timespan / 2;
  const newTimespan = timespan === 0 ? 3e4 : timespan * factor;
  const to = center + newTimespan / 2;
  const from = center - newTimespan / 2;
  return { from: toUtc(from), to: toUtc(to), raw: { from: toUtc(from), to: toUtc(to) } };
}
var TimeRangeDirection = /* @__PURE__ */ ((TimeRangeDirection2) => {
  TimeRangeDirection2[TimeRangeDirection2["Backward"] = 0] = "Backward";
  TimeRangeDirection2[TimeRangeDirection2["Forward"] = 1] = "Forward";
  return TimeRangeDirection2;
})(TimeRangeDirection || {});
function getShiftedTimeRange(dir, timeRange, upperLimit) {
  const oldTo = timeRange.to.valueOf();
  const oldFrom = timeRange.from.valueOf();
  const halfSpan = (oldTo - oldFrom) / 2;
  let fromRaw;
  let toRaw;
  if (dir === 0 /* Backward */) {
    fromRaw = oldFrom - halfSpan;
    toRaw = oldTo - halfSpan;
  } else {
    fromRaw = oldFrom + halfSpan;
    toRaw = oldTo + halfSpan;
    if (toRaw > upperLimit && oldTo < upperLimit) {
      toRaw = upperLimit;
      fromRaw = oldFrom;
    }
  }
  const from = toUtc(fromRaw);
  const to = toUtc(toRaw);
  return {
    from,
    to,
    raw: { from, to }
  };
}
const HISTORY_LOCAL_STORAGE_KEY = "grafana.dashboard.timepicker.history";
function deserializeHistory(value) {
  const values = JSON.parse(value);
  return values.map((item) => rangeUtil.convertRawToRange(item, "utc", void 0, "YYYY-MM-DD HH:mm:ss"));
}
function serializeHistory(values) {
  return JSON.stringify(
    limit(
      values.map((v) => ({
        from: typeof v.raw.from === "string" ? v.raw.from : v.raw.from.toISOString(),
        to: typeof v.raw.to === "string" ? v.raw.to : v.raw.to.toISOString()
      }))
    )
  );
}
function limit(value) {
  return uniqBy(value, (v) => v.from + v.to).slice(0, 4);
}
function isAbsolute(value) {
  return isDateTime(value.raw.from) || isDateTime(value.raw.to);
}

export { SceneTimePicker, TimeRangeDirection, getShiftedTimeRange, getZoomedTimeRange };
//# sourceMappingURL=SceneTimePicker.js.map
