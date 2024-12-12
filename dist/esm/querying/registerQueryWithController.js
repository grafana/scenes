import { Observable } from 'rxjs';
import { LoadingState } from '@grafana/schema';
import { sceneGraph } from '../core/sceneGraph/index.js';

function registerQueryWithController(entry) {
  return (queryStream) => {
    const queryControler = sceneGraph.getQueryController(entry.origin);
    if (!queryControler) {
      return queryStream;
    }
    return new Observable((observer) => {
      if (!entry.cancel) {
        entry.cancel = () => observer.complete();
      }
      queryControler.queryStarted(entry);
      let markedAsCompleted = false;
      const sub = queryStream.subscribe({
        next: (v) => {
          if (!markedAsCompleted && v.state !== LoadingState.Loading) {
            markedAsCompleted = true;
            queryControler.queryCompleted(entry);
          }
          observer.next(v);
        },
        error: (e) => observer.error(e),
        complete: () => {
          observer.complete();
        }
      });
      return () => {
        sub.unsubscribe();
        if (!markedAsCompleted) {
          queryControler.queryCompleted(entry);
        }
      };
    });
  };
}

export { registerQueryWithController };
//# sourceMappingURL=registerQueryWithController.js.map
