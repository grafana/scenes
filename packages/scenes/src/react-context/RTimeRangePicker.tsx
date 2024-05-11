import { TimeRangePicker } from '@grafana/ui';
import React from 'react';
import { useTimeRange } from './hooks';

export interface Props {}

export function RTimeRangePicker(props: Props) {
  const [value, sceneTimeRange] = useTimeRange();

  return (
    <TimeRangePicker
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
