import { TimeRangePicker as TimeRangePickerUI } from '@grafana/ui';
import React from 'react';
import { useTimeRange } from '../contexts/TimeRangeContext';

export interface Props {}

export function TimeRangePicker() {
  const timeRangeCtx = useTimeRange();

  return (
    <TimeRangePickerUI
      isOnCanvas={true}
      value={timeRangeCtx.state.value}
      onChange={(range) => timeRangeCtx.changeTimeRange(range)}
      timeZone={'utc'}
      onMoveBackward={() => {}}
      onMoveForward={() => {}}
      onZoom={() => {}}
      onChangeTimeZone={() => {}}
      onChangeFiscalYearStartMonth={() => {}}
    />
  );
}
