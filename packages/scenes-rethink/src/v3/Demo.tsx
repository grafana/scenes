import React from 'react';
import { TimeRangeContextProvider, useTimeRange } from '../contexts/TimeRangeContext';
import { Stack } from '@grafana/ui';
import { TimeRangePicker } from '../components/TimeRangePicker';
import { useDataQuery } from '../hooks/useDataQuery';
import { PanelRenderer } from '@grafana/runtime';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: Infinity } },
});

export function DemoV3() {
  return (
    <QueryClientProvider client={queryClient}>
      <TimeRangeContextProvider from="now-1h" to="now">
        <Stack direction="column">
          <TimeRangePicker />
          <Visualization />
        </Stack>
      </TimeRangeContextProvider>
    </QueryClientProvider>
  );
}

export function Visualization() {
  const timeRange = useTimeRange();
  const queryRes = useDataQuery({
    queries: [{ refId: 'A', queryType: 'randomWalk', datasource: { uid: 'gdev-testdata' } }],
  });

  return (
    <div>
      <h3>from: {timeRange.state.value.from.toString()}</h3>
      <h3>to: {timeRange.state.value.to.toString()}</h3>

      <PanelRenderer pluginId={'timeseries'} title={'Test'} width={500} height={500} data={queryRes.data} />
    </div>
  );
}
