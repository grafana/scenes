import { from, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { rangeUtil, CoreApp, DataTopic } from '@grafana/data';
import { getTemplateSrv, getRunRequest } from '@grafana/runtime';
import { shouldUseLegacyRunner, standardAnnotationSupport } from './standardAnnotationsSupport.js';
import { LoadingState } from '@grafana/schema';
import { getEnrichedDataRequest } from '../../getEnrichedDataRequest.js';
import { wrapInSafeSerializableSceneObject } from '../../../utils/wrapInSafeSerializableSceneObject.js';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
let counter = 100;
function getNextRequestId() {
  return "AQ" + counter++;
}
function executeAnnotationQuery(datasource, timeRange, query, layer) {
  var _a;
  if (datasource.annotationQuery && shouldUseLegacyRunner(datasource)) {
    console.warn("Using deprecated annotationQuery method, please upgrade your datasource");
    return from(
      datasource.annotationQuery({
        range: timeRange.state.value,
        rangeRaw: timeRange.state.value.raw,
        annotation: query,
        dashboard: {
          getVariables: getTemplateSrv().getVariables
        }
      })
    ).pipe(
      map((events) => ({
        state: LoadingState.Done,
        events
      }))
    );
  }
  const processor = __spreadValues(__spreadValues({}, standardAnnotationSupport), datasource.annotations);
  const annotationWithDefaults = __spreadValues(__spreadValues({}, (_a = processor.getDefaultQuery) == null ? void 0 : _a.call(processor)), query);
  const annotation = processor.prepareAnnotation(annotationWithDefaults);
  if (!annotation) {
    return of({
      state: LoadingState.Done,
      events: []
    });
  }
  const processedQuery = processor.prepareQuery(annotation);
  if (!processedQuery) {
    return of({
      state: LoadingState.Done,
      events: []
    });
  }
  const maxDataPoints = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const interval = rangeUtil.calculateInterval(timeRange.state.value, maxDataPoints, datasource.interval);
  const scopedVars = {
    __interval: { text: interval.interval, value: interval.interval },
    __interval_ms: { text: interval.intervalMs.toString(), value: interval.intervalMs },
    __annotation: { text: annotation.name, value: annotation },
    __sceneObject: wrapInSafeSerializableSceneObject(layer)
  };
  const queryRequest = __spreadValues(__spreadProps(__spreadValues({
    startTime: Date.now(),
    requestId: getNextRequestId(),
    range: timeRange.state.value,
    maxDataPoints,
    scopedVars
  }, interval), {
    app: CoreApp.Dashboard,
    timezone: timeRange.getTimeZone(),
    targets: [
      __spreadProps(__spreadValues({}, processedQuery), {
        refId: "Anno"
      })
    ]
  }), getEnrichedDataRequest(layer));
  const runRequest = getRunRequest();
  return runRequest(datasource, queryRequest).pipe(
    mergeMap((panelData) => {
      const data = (panelData == null ? void 0 : panelData.series.length) ? panelData.series : panelData.annotations;
      if (!(data == null ? void 0 : data.length)) {
        return of({
          state: panelData.state,
          events: []
        });
      }
      data.forEach((frame) => {
        var _a2;
        if (!((_a2 = frame.meta) == null ? void 0 : _a2.dataTopic)) {
          frame.meta = __spreadProps(__spreadValues({}, frame.meta || {}), { dataTopic: DataTopic.Annotations });
        }
      });
      return processor.processEvents(annotation, data).pipe(
        map((events) => {
          return {
            state: panelData.state,
            events: events || []
          };
        })
      );
    })
  );
}

export { executeAnnotationQuery };
//# sourceMappingURL=standardAnnotationQuery.js.map
