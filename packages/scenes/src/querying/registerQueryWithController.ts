import { Observable, catchError, from, map } from 'rxjs';
import { LoadingState } from '@grafana/schema';
import { sceneGraph } from '../core/sceneGraph';
import { QueryResultWithState, SceneQueryControllerEntry } from '../behaviors/types';
import { getScenePerformanceTracker, generateOperationId } from '../performance/ScenePerformanceTracker';

// Import performance callback types
import { QueryCompletionCallback } from '../performance/types';

export interface QueryProfilerLike {
  onQueryStarted(timestamp: number, entry: SceneQueryControllerEntry, queryId: string): QueryCompletionCallback | null;
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
      // A copy per subscription keeps the controller's running set and the global query counter in sync
      // when the same piped observable is subscribed more than once.
      const subscriptionEntry: SceneQueryControllerEntry = {
        ...entry,
        cancel: entry.cancel ?? (() => observer.complete()),
      };

      // Use existing request ID if available, otherwise generate one
      const queryId = entry.request?.requestId || `${entry.type}-${Math.floor(performance.now()).toString(36)}`;

      const startTimestamp = performance.now();
      let endQueryCallback: QueryCompletionCallback | null = null;

      if (profiler) {
        // Panel query: Use panel profiler
        endQueryCallback = profiler.onQueryStarted(startTimestamp, subscriptionEntry, queryId);
      } else {
        // Non-panel query: Track directly with simple approach
        const operationId = generateOperationId('query');
        getScenePerformanceTracker().notifyQueryStart({
          operationId,
          queryId,
          queryType: entry.type,
          origin: entry.origin.constructor.name,
          timestamp: startTimestamp,
        });

        // Create simple end callback for non-panel queries
        endQueryCallback = (endTimestamp: number, error?: any) => {
          getScenePerformanceTracker().notifyQueryComplete({
            operationId,
            queryId,
            queryType: entry.type,
            origin: entry.origin.constructor.name,
            timestamp: endTimestamp,
            duration: endTimestamp - startTimestamp,
            error: error ? error?.message || String(error) || 'Unknown error' : undefined,
          });
        };
      }

      queryControler.queryStarted(subscriptionEntry);
      let markedAsCompleted = false;

      const sub = queryStream.subscribe({
        next: (v) => {
          if (!markedAsCompleted && v.state !== LoadingState.Loading) {
            markedAsCompleted = true;
            queryControler.queryCompleted(subscriptionEntry);
            endQueryCallback?.(performance.now()); // Success case - no error
          }

          observer.next(v);
        },
        error: (e) => {
          if (!markedAsCompleted) {
            markedAsCompleted = true;
            queryControler.queryCompleted(subscriptionEntry);
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
          queryControler.queryCompleted(subscriptionEntry);
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
