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
  transform?: (query: DataQuery | DataQuery[]) => DataQuery | DataQuery[]
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
    .map((q) => q.value);

  let queries: DataQuery[];

  const hasMixedDatasources = new Set(interpolatedQueries.map((q) => q.datasource?.uid)).size > 1;

  // Apply transform based on whether we're dealing with multiple queries or a single query
  if (transform) {
    const result = transform(
      hasMixedDatasources || interpolatedQueries.length > 1 ? interpolatedQueries : interpolatedQueries[0]
    );
    queries = Array.isArray(result) ? result : [result];
  } else {
    queries = interpolatedQueries;
  }

  // For mixed datasource panels, use "-- Mixed --" as the datasource
  let datasource;
  if (hasMixedDatasources) {
    datasource = '-- Mixed --';
  } else {
    datasource = queries.find((query) => !!query.datasource?.uid)?.datasource?.uid;
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
