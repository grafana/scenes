import React from 'react';
import { TimeRangeContextProvider, useTimeRange } from '../contexts/TimeRangeContext';
import { Stack } from '@grafana/ui';
import { TimeRangePicker } from '../components/TimeRangePicker';

export function DemoV3() {
  return (
    <TimeRangeContextProvider from="now-1h" to="now">
      <Stack direction="column">
        <TimeRangePicker />
        <Visualization />
      </Stack>
    </TimeRangeContextProvider>
  );
}

export function Visualization() {
  const timeRange = useTimeRange();

  return (
    <div>
      <h3>from: {timeRange.state.value.from.toString()}</h3>
      <h3>to: {timeRange.state.value.to.toString()}</h3>
    </div>
  );
}
