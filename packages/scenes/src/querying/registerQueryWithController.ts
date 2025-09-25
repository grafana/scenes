import { Observable, catchError, from, map } from 'rxjs';
import { LoadingState } from '@grafana/schema';
import { sceneGraph } from '../core/sceneGraph';
import { QueryResultWithState, SceneQueryControllerEntry } from '../behaviors/types';
import { getScenePerformanceTracker, generateOperationId } from '../behaviors/ScenePerformanceTracker';

// Forward declaration to avoid circular imports
export interface QueryProfilerLike {
  onQueryStarted(
    timestamp: number,
    entry: SceneQueryControllerEntry,
    queryId: string
  ): ((endTimestamp: number, error?: any) => void) | null;
}

/**
 * Determine the query source type for non-panel queries
 */
function getQuerySource(type: string): 'annotation' | 'variable' | 'plugin' | 'datasource' | 'unknown' {
  if (type.includes('annotations') || type.includes('Annotations')) {
    return 'annotation';
  }
  if (type.includes('Variable') || type.includes('variable')) {
    return 'variable';
  }
  if (type.includes('loadPlugin') || type.includes('plugin')) {
    return 'plugin';
  }
  if (type.includes('getDataSource') || type.includes('datasource')) {
    return 'datasource';
  }
  return 'unknown';
}

/**
 * Will look for a scene object with a behavior that is a SceneQueryController and register the query with it.
 * Optionally accepts a panel profiler for direct query tracking callbacks.
 */
export function registerQueryWithController<T extends QueryResultWithState>(
  entry: SceneQueryControllerEntry,
  profiler?: QueryProfilerLike
) {
  return (queryStream: Observable<T>) => {
    const queryControler = sceneGraph.getQueryController(entry.origin);
    if (!queryControler) {
      return queryStream;
    }

    return new Observable<T>((observer) => {
      if (!entry.cancel) {
        entry.cancel = () => observer.complete();
      }

      // Use existing request ID if available, otherwise generate one
      const queryId = entry.request?.requestId || `${entry.type}-${Date.now()}-${Math.random()}`;

      // Track performance for panel vs non-panel queries
      let endQueryCallback: ((endTimestamp: number, error?: any) => void) | null = null;
      let operationId: string | null = null;
      const startTimestamp = performance.now();

      if (profiler) {
        // ✅ Panel query: Use panel profiler (which now uses panel operations internally)
        endQueryCallback = profiler.onQueryStarted(startTimestamp, entry, queryId);
      } else {
        // ✅ Non-panel query: Track directly using query performance data
        operationId = generateOperationId('query');
        getScenePerformanceTracker().notifyQueryStart({
          operationId,
          queryId,
          queryType: entry.type,
          querySource: getQuerySource(entry.type),
          origin: entry.origin.constructor.name,
          timestamp: startTimestamp,
        });

        // Create end callback for non-panel queries
        endQueryCallback = (endTimestamp: number, error?: any) => {
          if (operationId) {
            getScenePerformanceTracker().notifyQueryComplete({
              operationId,
              queryId,
              queryType: entry.type,
              querySource: getQuerySource(entry.type),
              origin: entry.origin.constructor.name,
              timestamp: endTimestamp,
              duration: endTimestamp - startTimestamp,
              error: error ? error?.message || String(error) || 'Unknown error' : undefined,
            });
          }
        };
      }

      queryControler.queryStarted(entry);
      let markedAsCompleted = false;

      const sub = queryStream.subscribe({
        next: (v) => {
          if (!markedAsCompleted && v.state !== LoadingState.Loading) {
            markedAsCompleted = true;
            queryControler.queryCompleted(entry);
            endQueryCallback?.(performance.now()); // Success case - no error
          }

          observer.next(v);
        },
        error: (e) => {
          if (!markedAsCompleted) {
            markedAsCompleted = true;
            queryControler.queryCompleted(entry);
            endQueryCallback?.(performance.now(), e); // Error case - pass error
          }
          observer.error(e);
        },
        complete: () => {
          observer.complete();
        },
      });

      return () => {
        sub.unsubscribe();

        if (!markedAsCompleted) {
          queryControler.queryCompleted(entry);
          endQueryCallback?.(performance.now()); // Cleanup case - no error
        }
      };
    });
  };
}

// Wraps an arbitrary Promise in an observble that emits Promise state
export function wrapPromiseInStateObservable(promise: Promise<any>): Observable<QueryResultWithState> {
  return new Observable<QueryResultWithState>((observer) => {
    // Emit 'loading' state initially
    observer.next({ state: LoadingState.Loading });

    // Convert the promise to an observable
    const promiseObservable = from(promise);

    // Subscribe to the promise observable
    promiseObservable
      .pipe(
        map(() => ({ state: LoadingState.Done })),

        catchError(() => {
          observer.next({ state: LoadingState.Error });
          return [];
        })
      )
      .subscribe({
        next: (result) => observer.next(result),
        complete: () => observer.complete(),
      });
  });
}
