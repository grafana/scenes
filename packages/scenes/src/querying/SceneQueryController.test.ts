import { LoadingState } from '@grafana/schema';
import { Observable } from 'rxjs';
import { QueryResultWithState, SceneQueryController } from './SceneQueryController';

describe('SceneQueryController', () => {
  let controller: SceneQueryController;

  beforeEach(() => {
    controller = new SceneQueryController({});
  });

  it('Wraps query observable', async () => {
    const { query, streamFuncs } = registerQuery(controller);
    let next = jest.fn();
    let complete = jest.fn();

    const sub1 = query.subscribe({ next, complete });

    next({ state: LoadingState.Loading });
    complete();

    expect(next).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(streamFuncs.cleanup).toHaveBeenCalledTimes(0);

    sub1.unsubscribe();
    expect(streamFuncs.cleanup).toHaveBeenCalledTimes(1);
  });

  it('Last unsubscribe should set running to false', async () => {
    const { query: query1 } = registerQuery(controller);

    const sub1 = query1.subscribe(() => {});

    expect(controller.state.isRunning).toBe(true);

    const { query: query2 } = registerQuery(controller);
    const sub2 = query2.subscribe(() => {});

    sub1.unsubscribe();
    expect(controller.state.isRunning).toBe(true);
    sub2.unsubscribe();
    expect(controller.state.isRunning).toBe(false);
  });

  it('can cancel all', async () => {
    const { query: query1, streamFuncs: streamFuncs1 } = registerQuery(controller);
    const sub1 = query1.subscribe(() => {});

    const { query: query2, streamFuncs: streamFuncs2 } = registerQuery(controller);
    const sub2 = query2.subscribe(() => {});

    controller.cancelAll();

    expect(controller.state.isRunning).toBe(false);
    expect(streamFuncs1.cleanup).toHaveBeenCalledTimes(1);
    expect(streamFuncs2.cleanup).toHaveBeenCalledTimes(1);
    expect(sub1.closed).toBe(true);
    expect(sub2.closed).toBe(true);
  });
});

function registerQuery(controller: SceneQueryController) {
  let streamFuncs = {
    next: (data: QueryResultWithState) => {},
    complete: () => {},
    cleanup: jest.fn(),
  };

  const runStream = new Observable<QueryResultWithState>((observer) => {
    streamFuncs.next = (data) => {
      observer.next(data);
    };
    streamFuncs.complete = () => observer.complete();

    return streamFuncs.cleanup;
  });

  const query = controller.registerQuery({ type: 'data', runStream });

  return { controller, query, streamFuncs };
}
