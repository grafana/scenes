import { from, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

import {
  AnnotationEvent,
  AnnotationQuery,
  CoreApp,
  DataQueryRequest,
  DataSourceApi,
  DataTopic,
  PanelModel,
  rangeUtil,
  ScopedVars,
} from '@grafana/data';

import { getRunRequest, getTemplateSrv } from '@grafana/runtime';
import { shouldUseLegacyRunner, standardAnnotationSupport } from './standardAnnotationsSupport';
import { Dashboard, LoadingState } from '@grafana/schema';
import { SceneObject, SceneTimeRangeLike } from '../../../core/types';
import { getEnrichedDataRequest } from '../../getEnrichedDataRequest';
import { wrapInSafeSerializableSceneObject } from '../../../utils/wrapInSafeSerializableSceneObject';
import { sceneGraph } from '../../../core/sceneGraph';
import { AdHocFilterWithLabels } from '../../../variables/adhoc/AdHocFiltersVariable';

let counter = 100;
function getNextRequestId() {
  return 'AQ' + counter++;
}

export interface AnnotationQueryOptions {
  dashboard: Dashboard;
  panel: PanelModel;
}

export interface AnnotationQueryResults {
  state: LoadingState;
  events: AnnotationEvent[];
}

export function executeAnnotationQuery(
  datasource: DataSourceApi,
  timeRange: SceneTimeRangeLike,
  query: AnnotationQuery,
  layer: SceneObject,
  filters?: AdHocFilterWithLabels[],
  groupByKeys?: string[]
): Observable<AnnotationQueryResults> {
  // Check if we should use the old annotationQuery method
  if (datasource.annotationQuery && shouldUseLegacyRunner(datasource)) {
    console.warn('Using deprecated annotationQuery method, please upgrade your datasource');
    return from(
      datasource.annotationQuery({
        range: timeRange.state.value,
        rangeRaw: timeRange.state.value.raw,
        annotation: query,
        dashboard: {
          getVariables: getTemplateSrv().getVariables,
        },
      })
    ).pipe(
      map((events) => ({
        state: LoadingState.Done,
        events,
      }))
    );
  }

  // Standard API for annotations support. Spread in datasource annotations support overrides
  const processor = {
    ...standardAnnotationSupport,
    ...datasource.annotations,
  };

  const annotationWithDefaults = {
    // Default query provided by a data source
    ...processor.getDefaultQuery?.(),
    ...query,
  };

  // Data source query migrations
  const annotation = processor.prepareAnnotation!(annotationWithDefaults);
  if (!annotation) {
    return of({
      state: LoadingState.Done,
      events: [],
    });
  }

  const processedQuery = processor.prepareQuery!(annotation);
  if (!processedQuery) {
    return of({
      state: LoadingState.Done,
      events: [],
    });
  }

  // No more points than pixels
  const maxDataPoints = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

  // Add interval to annotation queries
  const interval = rangeUtil.calculateInterval(timeRange.state.value, maxDataPoints, datasource.interval);

  const scopedVars: ScopedVars = {
    __interval: { text: interval.interval, value: interval.interval },
    __interval_ms: { text: interval.intervalMs.toString(), value: interval.intervalMs },
    __annotation: { text: annotation.name, value: annotation },
    __sceneObject: wrapInSafeSerializableSceneObject(layer),
  };

  const queryRequest: DataQueryRequest = {
    startTime: Date.now(),
    requestId: getNextRequestId(),
    range: timeRange.state.value,
    maxDataPoints,
    scopedVars,
    ...interval,
    app: CoreApp.Dashboard,
    timezone: timeRange.getTimeZone(),
    targets: [
      {
        ...processedQuery,
        refId: 'Anno',
      },
    ],
    scopes: sceneGraph.getScopes(layer),
    filters,
    groupByKeys,
    ...getEnrichedDataRequest(layer),
  };

  const runRequest = getRunRequest();

  return runRequest(datasource, queryRequest).pipe(
    mergeMap((panelData) => {
      // Some annotations set the topic already
      const data = panelData?.series.length ? panelData.series : panelData.annotations;

      if (!data?.length) {
        return of({
          state: panelData.state,
          events: [],
        });
      }

      // Add data topic to each frame
      data.forEach((frame) => {
        // If data topic has not been provided by the data source, make sure it's set correctly
        if (!frame.meta?.dataTopic) {
          frame.meta = { ...(frame.meta || {}), dataTopic: DataTopic.Annotations };
        }
      });

      return processor.processEvents!(annotation, data).pipe(
        map((events) => {
          return {
            state: panelData.state,
            events: events || [],
          };
        })
      );
    })
  );
}
