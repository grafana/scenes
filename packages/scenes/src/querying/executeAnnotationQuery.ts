import { from, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

import {
  AnnotationQuery,
  CoreApp,
  DataQueryRequest,
  DataSourceApi,
  rangeUtil,
  ScopedVars,
  TimeRange,
} from '@grafana/data';

import { shouldUseLegacyRunner, standardAnnotationSupport } from './standardAnnotationSupport';
import { AnnotationQueryResponse } from './types';
import { getRunRequest } from '@grafana/runtime';

let counter = 100;
function getNextRequestId() {
  return 'AQ' + counter++;
}

export function executeAnnotationQuery(
  datasource: DataSourceApi,
  timeRange: TimeRange,
  annotationQuery: AnnotationQuery
): Observable<AnnotationQueryResponse> {
  // Check if we should use the old annotationQuery method
  if (datasource.annotationQuery && shouldUseLegacyRunner(datasource)) {
    return from(
      datasource.annotationQuery({
        range: timeRange,
        rangeRaw: timeRange.raw,
        annotation: annotationQuery,
        dashboard: {},
      })
    ).pipe(map((annotationEvents) => ({ events: annotationEvents })));
  }

  const processor = {
    ...standardAnnotationSupport,
    ...datasource.annotations,
  };

  const annotationWithDefaults = {
    ...processor.getDefaultQuery?.(),
    ...annotationQuery,
  };

  const annotation = processor.prepareAnnotation!(annotationWithDefaults);
  if (!annotation) {
    return of({});
  }

  const query = processor.prepareQuery!(annotation);
  if (!query) {
    return of({});
  }

  // No more points than pixels
  const maxDataPoints = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

  // Add interval to annotation queries
  const interval = rangeUtil.calculateInterval(timeRange, maxDataPoints, datasource.interval);

  const scopedVars: ScopedVars = {
    __interval: { text: interval.interval, value: interval.interval },
    __interval_ms: { text: interval.intervalMs.toString(), value: interval.intervalMs },
    __annotation: { text: annotation.name, value: annotation },
  };

  const queryRequest: DataQueryRequest = {
    startTime: Date.now(),
    requestId: getNextRequestId(),
    range: timeRange,
    maxDataPoints,
    scopedVars,
    ...interval,
    app: CoreApp.Dashboard,
    // TODO
    //publicDashboardAccessToken: options.dashboard.meta.publicDashboardAccessToken,
    // TODO pass correct timezone
    timezone: 'browser',
    targets: [
      {
        ...query,
        refId: 'Anno',
      },
    ],
  };

  const runRequest = getRunRequest();

  return runRequest(datasource, queryRequest).pipe(
    mergeMap((panelData) => {
      // Some annotations set the topic already
      const data = panelData?.series.length ? panelData.series : panelData.annotations;
      if (!data?.length) {
        return of({ panelData, events: [] });
      }
      return processor.processEvents!(annotation, data).pipe(map((events) => ({ panelData, events })));
    })
  );
}
