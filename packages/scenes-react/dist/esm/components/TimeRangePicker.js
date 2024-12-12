import { TimeRangePicker as TimeRangePicker$1 } from '@grafana/ui';
import React from 'react';
import { useTimeRange } from '../hooks/hooks.js';

function TimeRangePicker(props) {
  const [value, sceneTimeRange] = useTimeRange();
  return /* @__PURE__ */ React.createElement(TimeRangePicker$1, {
    isOnCanvas: true,
    value,
    onChange: sceneTimeRange.onTimeRangeChange,
    timeZone: sceneTimeRange.getTimeZone(),
    onMoveBackward: () => {
    },
    onMoveForward: () => {
    },
    onZoom: () => {
    },
    onChangeTimeZone: () => {
    },
    onChangeFiscalYearStartMonth: () => {
    }
  });
}

export { TimeRangePicker };
//# sourceMappingURL=TimeRangePicker.js.map
