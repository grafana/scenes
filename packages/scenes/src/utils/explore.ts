import { PanelData, RawTimeRange, ScopedVars } from '@grafana/data';
import { SceneObject } from '../core/types';
import { wrapInSafeSerializableSceneObject } from './wrapInSafeSerializableSceneObject';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';

/**
 * Returns URL to Grafana explore for the queries in the given panel data and time range.
 */
export async function getExploreURL(
  data: PanelData,
  model: SceneObject,
  timeRange: RawTimeRange,
  transform?: (query: DataQuery) => DataQuery
): Promise<string> {
  const targets = data.request?.targets;
  if (!targets) {
    return '';
  }

  const { from, to } = timeRange;
  const filters = data.request?.filters;

  const scopedVars: ScopedVars = {
    __sceneObject: wrapInSafeSerializableSceneObject(model),
  };

  const interpolatedQueries = (
    await Promise.allSettled(
      targets.map(async (q) => {
        const queryDs = await getDataSourceSrv().get(q.datasource);
        return queryDs.interpolateVariablesInQueries?.([q], scopedVars ?? {}, filters)[0] || q;
      })
    )
  )
    .filter((promise): promise is PromiseFulfilledResult<DataQuery> => promise.status === 'fulfilled')
    .map((q) => q.value)
    .map((q) => transform?.(q) ?? q);

  const queries: DataQuery[] = interpolatedQueries?.flat() ?? [];

  // Check if we have mixed datasources (more than one unique datasource)
  const hasMixedDatasources = new Set(queries.map((q) => q.datasource?.uid)).size > 1;

  // For mixed datasources, mark the datasource as "-- Mixed --"
  let datasource = hasMixedDatasources
    ? '-- Mixed --'
    : queries.find((query) => !!query.datasource?.uid)?.datasource?.uid;

  // If there are multiple queries with different data sources, ensure all queries are included.
  // Maintain all queries and just update the datasource for mixed case
  if (hasMixedDatasources) {
    queries.forEach((query) => {
      if (!query.datasource?.uid) {
        query.datasource = { uid: '-- Mixed --' }; // For mixed datasource, mark as "-- Mixed --"
      }
    });
  }

  if (queries?.length && datasource && from && to) {
    const left = encodeURIComponent(
      JSON.stringify({
        datasource,
        queries,
        range: {
          from,
          to,
        },
      })
    );

    return `/explore?left=${left}`;
  }
  return '';
}
