import { TimeRangePicker as TimeRangePickerUI } from '@grafana/ui';
import React from 'react';
import { useTimeRange } from '../hooks/hooks';

export interface Props {}

export function TimeRangePicker(props: Props) {
  const [value, sceneTimeRange] = useTimeRange();

  return (
    <TimeRangePickerUI
      isOnCanvas={true}
      value={value}
      onChange={sceneTimeRange.onTimeRangeChange}
      timeZone={sceneTimeRange.getTimeZone()}
      onMoveBackward={() => {}}
      onMoveForward={() => {}}
      onZoom={() => {}}
      onChangeTimeZone={() => {}}
      onChangeFiscalYearStartMonth={() => {}}
    />
  );
}
