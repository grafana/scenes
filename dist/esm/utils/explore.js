import { wrapInSafeSerializableSceneObject } from './wrapInSafeSerializableSceneObject.js';
import { getDataSourceSrv } from '@grafana/runtime';

async function getExploreURL(data, model, timeRange, transform) {
  var _a, _b, _c, _d;
  const targets = (_a = data.request) == null ? void 0 : _a.targets;
  if (!targets) {
    return "";
  }
  const { from, to } = timeRange;
  const filters = (_b = data.request) == null ? void 0 : _b.filters;
  const scopedVars = {
    __sceneObject: wrapInSafeSerializableSceneObject(model)
  };
  const interpolatedQueries = (await Promise.allSettled(
    targets.map(async (q) => {
      var _a2;
      const queryDs = await getDataSourceSrv().get(q.datasource);
      return ((_a2 = queryDs.interpolateVariablesInQueries) == null ? void 0 : _a2.call(queryDs, [q], scopedVars != null ? scopedVars : {}, filters)[0]) || q;
    })
  )).filter((promise) => promise.status === "fulfilled").map((q) => q.value).map((q) => {
    var _a2;
    return (_a2 = transform == null ? void 0 : transform(q)) != null ? _a2 : q;
  });
  const queries = interpolatedQueries != null ? interpolatedQueries : [];
  const datasource = (_d = (_c = queries.find((query) => {
    var _a2;
    return !!((_a2 = query.datasource) == null ? void 0 : _a2.uid);
  })) == null ? void 0 : _c.datasource) == null ? void 0 : _d.uid;
  if ((queries == null ? void 0 : queries.length) && datasource && from && to) {
    const left = encodeURIComponent(
      JSON.stringify({
        datasource,
        queries,
        range: {
          from,
          to
        }
      })
    );
    return `/explore?left=${left}`;
  }
  return "";
}

export { getExploreURL };
//# sourceMappingURL=explore.js.map
