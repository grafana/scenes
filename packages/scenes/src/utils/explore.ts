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

  const queries: DataQuery[] = interpolatedQueries ?? [];

  const datasource = queries.find((query) => !!query.datasource?.uid)?.datasource?.uid;

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
