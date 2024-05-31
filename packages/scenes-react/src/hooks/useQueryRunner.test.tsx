import { renderHook } from '@testing-library/react';
import { useQueryRunner } from './useQueryRunner';
import {
  DataSourceApi,
  DataQueryRequest,
  PanelData,
  LoadingState,
  DataQueryResponse,
  toDataFrame,
} from '@grafana/data';
import { Observable, map, of } from 'rxjs';
import { getHookContextWrapper } from '../utils/testUtils';

const getDataSourceMock = jest.fn().mockReturnValue({
  uid: 'test-uid',
  getRef: () => ({ uid: 'test-uid' }),
  query: () => {
    return of({
      data: [
        toDataFrame({
          refId: 'A',
          datapoints: [
            [100, 1],
            [200, 2],
            [300, 3],
          ],
        }),
      ],
    });
  },
});

const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: PanelData = {
    state: LoadingState.Loading,
    series: [],
    annotations: [],
    timeRange: request.range,
  };

  return (ds.query(request) as Observable<DataQueryResponse>).pipe(
    map((packet) => {
      result.state = LoadingState.Done;
      result.series = packet.data.filter((d) => d.meta?.dataTopic !== 'annotations');
      result.annotations = packet.data.filter((d) => d.meta?.dataTopic === 'annotations');
      return result;
    })
  );
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    return runRequestMock(ds, request);
  },
  getDataSourceSrv: () => {
    return {
      get: getDataSourceMock,
      getInstanceSettings: () => ({ uid: 'test-uid' }),
    };
  },
}));

describe('useQueryRunner', () => {
  it('Should return query runner', async () => {
    const { context, wrapper } = getHookContextWrapper({});

    const { result, rerender, unmount } = renderHook(useQueryRunner, {
      wrapper,
      initialProps: {
        queries: [{ uid: 'gdev-testdata', refId: 'first', scenarioId: 'random_walk', alias: 'env' }],
        maxDataPoints: 20,
      },
    });

    const queryRunner = result.current;
    expect(queryRunner.state.queries[0].refId).toBe('first');
    expect(queryRunner.state.maxDataPoints).toBe(20);

    // should add to scene context
    expect(context.state.children[0]).toBe(queryRunner);

    // should activate it
    expect(queryRunner.isActive).toBe(true);

    // Can update queries
    rerender({
      queries: [{ uid: 'gdev-testdata', refId: 'first', scenarioId: 'random_walk', alias: 'Updated alias' }],
    });
    expect(queryRunner.state.queries[0].alias).toBe('Updated alias');

    await new Promise((r) => setTimeout(r, 1));

    // should re-run queries
    expect(runRequestMock.mock.calls.length).toBe(2);

    // unmount should remove and de-activate query runner
    unmount();
    expect(queryRunner.isActive).toBe(false);
    expect(context.state.children.length).toBe(0);
  });
});
