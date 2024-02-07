import { Observable } from 'rxjs';
import { LoadingState } from '@grafana/schema';
import { sceneGraph } from '../core/sceneGraph';
import { QueryResultWithState, SceneQueryControllerEntry } from './SceneQueryController';

export function registerQueryWithController<T extends QueryResultWithState>(entry: SceneQueryControllerEntry) {
  return (queryStream: Observable<T>) => {
    const queryControler = sceneGraph.getQueryController(entry.sceneObject);
    if (!queryControler) {
      return queryStream;
    }

    return new Observable<T>((observer) => {
      if (!entry.cancel) {
        entry.cancel = () => observer.complete();
      }

      queryControler.queryStarted(entry);

      const sub = queryStream.subscribe({
        next: (v) => {
          if (v.state !== LoadingState.Loading) {
            queryControler.queryCompleted(entry);
          }

          observer.next(v);
        },
        error: (e) => observer.error(e),
        complete: () => {
          observer.complete();
        },
      });

      return () => {
        sub.unsubscribe();
        queryControler.queryCompleted(entry);
      };
    });
  };
}
