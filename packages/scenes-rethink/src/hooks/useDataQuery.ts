import { DataQuery } from '@grafana/schema';
import { QueryKey, UseQueryOptions, UseQueryResult, useQueries, useQueryClient } from '@tanstack/react-query';
import { getDataSourceSrv, getRunRequest } from '@grafana/runtime';
import { DataQueryRequest, PanelData } from '@grafana/data';
import { lastValueFrom, map } from 'rxjs';
import { useTimeRange } from '../contexts/TimeRangeContext';
import { useId } from 'react';
// import { hasCustomVariableSupport } from './Components/variables/query/guards';
// import { useInterpolatableVariablesResolved } from './hooks/variables/useInterpolatableVariablesResolved';
// import { useVariableInterpolator } from './hooks/variables/useVariableInterpolator';
// import { useVariables } from './hooks/variables/useVariables';
// import { variablesToScopedVars } from './utils/variables';

export interface DataQueryOptions<P = PanelData> {
  enabled?: boolean;
  variableQuery?: boolean;
  transform?: (data: PanelData) => P;
  staleTime?: number;
}

export function useDataQuery<T extends DataQuery, P = PanelData>(
  queries: T[],
  options?: DataQueryOptions<P>
): Array<UseQueryResult<P, Error>> {
  const requestId = useId();
  const runRequest = getRunRequest();
  const ds = getDataSourceSrv();
  const [{ timeRange }, , , { rangeToken }] = useTimeRange();
  const queryClient = useQueryClient();

  // FIXME: move this (possibly in useVariables)
  const variablesLoaded = useInterpolatableVariablesResolved(
    // @ts-expect-error
    ...queries.flatMap((q) => [q.datasource?.uid, q.query, q.expr]).filter((x) => !!x)
  );

  const interpolate = useVariableInterpolator();
  const scopedVars = variablesToScopedVars(useVariables());

  const targets = queries.map((query) => {
    const target = { ...query };
    if ('datasource' in target) {
      target.datasource = {
        ...query.datasource,
      };
      if (target.datasource.uid) {
        target.datasource.uid = interpolate(target.datasource.uid);
      }
    }
    return target;
  });

  const datasources = useQueries({
    queries: targets.map((query) => {
      return {
        queryKey: ['ds', query.datasource],
        queryFn: () => {
          return ds.get(query.datasource);
        },
        staleTime: Infinity,
      };
    }),
  });

  const q = Object.entries(
    // Group queries by datasource, discarding queries without a datasource
    targets.reduce<Record<string, T[]>>((acc, query) => {
      if (!query.datasource?.uid) {
        return acc;
      }

      const dataSourceUid = query.datasource.uid;

      return {
        ...acc,
        [dataSourceUid]: [...(acc?.[dataSourceUid] || []), query],
      };
    }, {})
  ).map(([datasourceUid, queries], i) => {
    const datasource = datasources.find((ds) => ds.data?.getRef().uid === datasourceUid)?.data;
    const { raw, ...absoluteRange } = timeRange;

    const loadPreviousData = (queryKey: QueryKey) => () => {
      const data = queryClient.getQueriesData<P>({ queryKey });
      const avail = data.filter((x) => !!x[1]);
      const last = avail[avail.length - 1]?.[1];
      return last;
    };

    const queryOptions: UseQueryOptions = {
      enabled: variablesLoaded && !!datasource?.query && options?.enabled !== false,
      staleTime: options?.staleTime ?? queryClient.getDefaultOptions().queries?.staleTime,
      /** The key should be formed by everything that contributes to the query:
       *
       * 1. The datasource
       * 2. The query itself
       * 4. The query options
       * 5. The variables (and their values) used in the query
       * */
      queryKey: ['data', queries, rangeToken, scopedVars, JSON.stringify(absoluteRange)],
      // When time range or variables change, we want to use the last value of the query as initial data
      placeholderData: loadPreviousData(['data', queries, rangeToken]),
      queryFn: () => {
        let request: DataQueryRequest = {
          requestId: requestId + `-${i}`,
          targets: queries,
          app: 'demo-app',
          range: timeRange,
          rangeRaw: raw,
          startTime: Date.now(),
          // TODO: use actual values for the following properties
          timezone: 'utc',
          interval: '1m',
          intervalMs: 6000,
          maxDataPoints: 1200,
          scopedVars,
          liveStreaming: false,
        };
        const obs = runRequest(
          datasource!,
          request,
          options?.variableQuery && hasCustomVariableSupport(datasource!)
            ? datasource.variables.query.bind(datasource!.variables)
            : undefined
        );
        return lastValueFrom<P>(obs.pipe<P>(map(options?.transform ?? ((x) => x as P))));
      },
    };

    return queryOptions;
  }, {});

  const queriesResult = useQueries({
    queries: q,
  });

  return queriesResult as Array<UseQueryResult<P, Error>>;
}
