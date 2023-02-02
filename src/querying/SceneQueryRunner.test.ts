import { map, of } from 'rxjs';

import {
  ArrayVector,
  DataQueryRequest,
  DataSourceApi,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  standardTransformersRegistry,
  toDataFrame,
} from '@grafana/data';

import { SceneTimeRange } from '../core/SceneTimeRange';

import { SceneQueryRunner } from './SceneQueryRunner';

const getDataSourceMock = jest.fn().mockReturnValue({
  getRef: () => ({ uid: 'test' }),
});

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [
      toDataFrame([
        [100, 1],
        [200, 2],
        [300, 3],
      ]),
    ],
    timeRange: getDefaultTimeRange(),
  })
);

let sentRequest: DataQueryRequest | undefined;

jest.mock('@grafana/runtime', () => ({
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    sentRequest = request;
    return runRequestMock(ds, request);
  },
  getDataSourceSrv: () => {
    return { get: getDataSourceMock };
  },
}));

describe('SceneQueryRunner', () => {
  afterEach(() => {
    runRequestMock.mockClear();
    getDataSourceMock.mockClear();
  });
  describe('when activated and got no data', () => {
    it('should run queries', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      // Default max data points
      expect(sentRequest?.maxDataPoints).toBe(500);
    });

    it('should pass scene object via scoped vars when resolving datasource and running request', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      const getDataSourceCall = getDataSourceMock.mock.calls[0];
      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].scopedVars.__sceneObject).toEqual({ value: queryRunner, text: '__sceneObject' });
      expect(getDataSourceCall[1].__sceneObject).toEqual({ value: queryRunner, text: '__sceneObject' });
    });
  });

  describe('when container width changed during deactivation', () => {
    it('and container width is 0 but previously was rendered', async () => {
      const timeRange = new SceneTimeRange();
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: timeRange,
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();
      // When consumer viz is rendered with width 1000
      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall1 = runRequestMock.mock.calls[0];
      // should be run with default maxDataPoints
      expect(runRequestCall1[1].maxDataPoints).toEqual(500);

      queryRunner.setContainerWidth(1000);
      queryRunner.deactivate();
      // When width is externally set to 0 before the consumer container has not yet rendered with expected width
      queryRunner.setContainerWidth(0);
      queryRunner.activate();

      timeRange.setState({ from: 'now-10m' });
      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(runRequestCall2[1].maxDataPoints).toEqual(1000);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    });
  });
  describe('when activated and maxDataPointsFromWidth set to true', () => {
    it('should run queries', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        maxDataPointsFromWidth: true,
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBeUndefined();

      queryRunner.setContainerWidth(1000);

      expect(queryRunner.state.data?.state).toBeUndefined();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    });
  });

  describe('transformations', () => {
    let transformerSpy1 = jest.fn();
    let transformerSpy2 = jest.fn();

    beforeEach(() => {
      standardTransformersRegistry.setInit(() => {
        return [
          {
            id: 'customTransformer1',
            editor: () => null,
            transformation: {
              id: 'customTransformer1',
              name: 'Custom Transformer',
              operator: (options) => (source) => {
                transformerSpy1(options);
                return source.pipe(
                  map((data) => {
                    return data.map((frame) => {
                      return {
                        ...frame,
                        fields: frame.fields.map((field) => {
                          return {
                            ...field,
                            values: new ArrayVector(field.values.toArray().map((v) => v * 2)),
                          };
                        }),
                      };
                    });
                  })
                );
              },
            },
            name: 'Custom Transformer',
          },
          {
            id: 'customTransformer2',
            editor: () => null,
            transformation: {
              id: 'customTransformer2',
              name: 'Custom Transformer2',
              operator: (options) => (source) => {
                transformerSpy2(options);
                return source.pipe(
                  map((data) => {
                    return data.map((frame) => {
                      return {
                        ...frame,
                        fields: frame.fields.map((field) => {
                          return {
                            ...field,
                            values: new ArrayVector(field.values.toArray().map((v) => v * 3)),
                          };
                        }),
                      };
                    });
                  })
                );
              },
            },
            name: 'Custom Transformer 2',
          },
        ];
      });
    });

    it('should apply transformations to query results', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        maxDataPoints: 100,
        transformations: [
          {
            id: 'customTransformer1',
            options: {
              option: 'value1',
            },
          },
          {
            id: 'customTransformer2',
            options: {
              option: 'value2',
            },
          },
        ],
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(transformerSpy1).toHaveBeenCalledTimes(1);
      expect(transformerSpy1).toHaveBeenCalledWith({ option: 'value1' });
      expect(transformerSpy2).toHaveBeenCalledTimes(1);
      expect(transformerSpy2).toHaveBeenCalledWith({ option: 'value2' });
      expect(queryRunner.state.data?.series).toHaveLength(1);
      expect(queryRunner.state.data?.series[0].fields).toHaveLength(2);
      expect(queryRunner.state.data?.series[0].fields[0].values.toArray()).toEqual([600, 1200, 1800]);
      expect(queryRunner.state.data?.series[0].fields[1].values.toArray()).toEqual([6, 12, 18]);
    });
  });
});
