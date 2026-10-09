import { LoadingState } from '@grafana/schema';
import { Observable, Subject } from 'rxjs';
import { SceneObject } from '../core/types';
import { TestScene } from '../variables/TestScene';
import { SceneQueryController } from './SceneQueryController';
import { registerQueryWithController } from '../querying/registerQueryWithController';
import { QueryResultWithState } from './types';

// Mock crypto.randomUUID for generateOperationId
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-1234-5678-9abc-def012345678'),
  },
});

describe('SceneQueryController', () => {
  let controller: SceneQueryController;
  let scene: SceneObject;

  beforeEach(() => {
    controller = new SceneQueryController();
    scene = new TestScene({
      $behaviors: [controller],
    });
  });

  it('Wraps query observable', async () => {
    const { query, streamFuncs } = registerQuery(scene);
    let next = jest.fn();
    let complete = jest.fn();

    query.subscribe({ next, complete });

    streamFuncs.next({ state: LoadingState.Loading });
    streamFuncs.complete();

    expect(next).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(streamFuncs.cleanup).toHaveBeenCalledTimes(1);
  });

  it('should mark query as complete when packet sent with state != Loading', async () => {
    const { query, streamFuncs } = registerQuery(scene);
    let next = jest.fn();
    let complete = jest.fn();

    query.subscribe({ next, complete });

    expect((window as any).__grafanaRunningQueryCount).toBe(1);
    expect(controller.state.isRunning).toBe(true);

    streamFuncs.next({ state: LoadingState.Done });

    expect((window as any).__grafanaRunningQueryCount).toBe(0);
    expect(controller.state.isRunning).toBe(false);

    streamFuncs.complete();

    expect((window as any).__grafanaRunningQueryCount).toBe(0);
  });

  it('Last unsubscribe should set running to false', async () => {
    const { query: query1 } = registerQuery(scene);

    const sub1 = query1.subscribe(() => {});

    expect(controller.state.isRunning).toBe(true);

    const { query: query2 } = registerQuery(scene);
    const sub2 = query2.subscribe(() => {});

    sub1.unsubscribe();
    expect(controller.state.isRunning).toBe(true);
    sub2.unsubscribe();
    expect(controller.state.isRunning).toBe(false);
  });

  it('can cancel all', async () => {
    const { query: query1, streamFuncs: streamFuncs1 } = registerQuery(scene);
    const sub1 = query1.subscribe(() => {});

    const { query: query2, streamFuncs: streamFuncs2 } = registerQuery(scene);
    const sub2 = query2.subscribe(() => {});

    controller.cancelAll();

    expect(controller.state.isRunning).toBe(false);
    expect(streamFuncs1.cleanup).toHaveBeenCalledTimes(1);
    expect(streamFuncs2.cleanup).toHaveBeenCalledTimes(1);
    expect(sub1.closed).toBe(true);
    expect(sub2.closed).toBe(true);
  });

  it('clears running queries on deactivate', async () => {
    const deactivate = scene.activate();
    const { query } = registerQuery(scene);
    const sub = query.subscribe(() => {});

    expect((window as any).__grafanaRunningQueryCount).toBe(1);

    deactivate();

    expect((window as any).__grafanaRunningQueryCount).toBe(0);

    sub.unsubscribe();

    expect((window as any).__grafanaRunningQueryCount).toBe(0);
  });

  it('tracks each subscription of the same query separately', async () => {
    const source = new Subject<QueryResultWithState>();
    const query = source.pipe(registerQueryWithController({ type: 'data', origin: scene }));

    query.subscribe(() => {});
    query.subscribe(() => {});

    expect((window as any).__grafanaRunningQueryCount).toBe(2);
    expect(controller.runningQueriesCount()).toBe(2);

    source.next({ state: LoadingState.Done });

    expect((window as any).__grafanaRunningQueryCount).toBe(0);
    expect(controller.state.isRunning).toBe(false);
  });

  it('cancel all completes every subscription of the same query', async () => {
    const source = new Subject<QueryResultWithState>();
    const query = source.pipe(registerQueryWithController({ type: 'data', origin: scene }));

    const sub1 = query.subscribe(() => {});
    const sub2 = query.subscribe(() => {});

    controller.cancelAll();

    expect(sub1.closed).toBe(true);
    expect(sub2.closed).toBe(true);
    expect((window as any).__grafanaRunningQueryCount).toBe(0);
  });

  it('does not count a duplicate start of the same entry', async () => {
    const entry = { type: 'data', origin: scene };

    controller.queryStarted(entry);
    controller.queryStarted(entry);
    controller.queryCompleted(entry);

    expect((window as any).__grafanaRunningQueryCount).toBe(0);
    expect(controller.state.isRunning).toBe(false);
  });
});

function registerQuery(scene: SceneObject) {
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

  const query = runStream.pipe(registerQueryWithController({ type: 'data', origin: scene }));

  return { query, streamFuncs };
}
