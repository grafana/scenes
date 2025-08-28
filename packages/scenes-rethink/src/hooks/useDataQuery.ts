import { DataQuery, DataSourceRef } from '@grafana/schema';
import { QueryKey, UseQueryOptions, UseQueryResult, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDataSourceSrv, getRunRequest } from '@grafana/runtime';
import { DataQueryRequest, PanelData } from '@grafana/data';
import { lastValueFrom, map, timer } from 'rxjs';
import { useTimeRange } from '../contexts/TimeRangeContext';
import { useId } from 'react';
// import { hasCustomVariableSupport } from './Components/variables/query/guards';
// import { useInterpolatableVariablesResolved } from './hooks/variables/useInterpolatableVariablesResolved';
// import { useVariableInterpolator } from './hooks/variables/useVariableInterpolator';
// import { useVariables } from './hooks/variables/useVariables';
// import { variablesToScopedVars } from './utils/variables';

export interface DataQueryOptions<T extends DataQuery> {
  enabled?: boolean;
  queries: DataQuery[];
  staleTime?: number;
}

export function useDataQuery<T extends DataQuery>(options: DataQueryOptions<T>): UseQueryResult<PanelData, Error> {
  const requestId = useId();
  const runRequest = getRunRequest();
  const dataSourceSrv = getDataSourceSrv();
  const timeRangeCtx = useTimeRange();
  const queryClient = useQueryClient();
  const timeRange = timeRangeCtx.state.value;

  // // FIXME: move this (possibly in useVariables)
  // const variablesLoaded = useInterpolatableVariablesResolved(
  //   // @ts-expect-error
  //   ...queries.flatMap((q) => [q.datasource?.uid, q.query, q.expr]).filter((x) => !!x)
  // );

  //const interpolate = useVariableInterpolator();
  //  const scopedVars = variablesToScopedVars(useVariables());

  const dsRef = findFirstDatasource(options.queries);
  const dsQuery = useQuery({
    queryKey: ['ds', dsRef],
    queryFn: () => dataSourceSrv.get(dsRef),
    staleTime: Infinity,
  });

  const loadPreviousData = (queryKey: QueryKey) => () => {
    const data = queryClient.getQueriesData<P>({ queryKey });
    const avail = data.filter((x) => !!x[1]);
    const last = avail[avail.length - 1]?.[1];
    return last;
  };

  const timeRangeKey = `${timeRange.from.valueOf()}-${timeRange.to.valueOf()}`;
  const queries = options.queries;

  const queryOptions: UseQueryOptions<PanelData> = {
    enabled: dsQuery.data && options.enabled !== false,
    staleTime: options?.staleTime,
    queryKey: ['data', queries, timeRangeKey],
    placeholderData: loadPreviousData(['data', queries, timeRangeKey]),
    queryFn: () => {
      const request: DataQueryRequest = {
        requestId: requestId + `-${Date.now()}`,
        targets: queries,
        app: 'demo-app',
        range: timeRange,
        rangeRaw: timeRange.raw,
        startTime: Date.now(),
        // TODO: use actual values for the following properties
        timezone: 'utc',
        interval: '1m',
        intervalMs: 6000,
        maxDataPoints: 1200,
        scopedVars: {},
        liveStreaming: false,
      };

      const obs = runRequest(dsQuery.data!, request);

      return lastValueFrom(obs);
    },
  };

  return useQuery<PanelData, Error>(queryOptions);
}

export function findFirstDatasource(targets: DataQuery[]): DataSourceRef | undefined {
  return targets.find((t) => t.datasource !== null)?.datasource ?? undefined;
}
