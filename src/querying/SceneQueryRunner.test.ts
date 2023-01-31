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
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { TestVariable } from '../variables/variants/TestVariable';

const getDataSourceMock = jest.fn().mockReturnValue({
  getRef: () => ({ uid: 'test' }),
});

const result = toDataFrame([
  [100, 1],
  [200, 2],
  [300, 3],
]);
const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [result],
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
      // expect(runRequestCall[1].scopedVars.__sceneObject.value).toBe(queryRunner);
      expect(runRequestCall[1].scopedVars.__sceneObject).toEqual({ value: queryRunner, text: '__sceneObject' });
      expect(getDataSourceCall[1].__sceneObject).toEqual({ value: queryRunner, text: '__sceneObject' });
    });
  });

  describe('when re-activated', () => {
    describe('variables have changed', () => {
      it('should run queries', async () => {
        const v1 = new TestVariable({ name: 'A', query: 'A.*', value: 'a', text: '', options: [], delayMs: 1 });
        const v2 = new TestVariable({ name: 'B', query: 'B.*', value: 'b', text: '', options: [], delayMs: 1 });
        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A', expr: '${A} ${B}' }],
          $timeRange: new SceneTimeRange(),
        });

        const scene = new EmbeddedScene({
          $data: queryRunner,
          $variables: new SceneVariableSet({
            variables: [v1, v2],
          }),
          body: new SceneFlexLayout({
            children: [],
          }),
        });

        expect(queryRunner.state.data).toBeUndefined();

        scene.activate();

        await new Promise((r) => setTimeout(r, 40));

        expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
        expect(queryRunner.state.data?.series).toEqual([result]);
        expect(runRequestMock).toHaveBeenCalledTimes(2);

        scene.deactivate();

        v1.setState({ value: 'a1' });
        v2.setState({ value: 'b1' });

        scene.activate();

        await new Promise((r) => setTimeout(r, 40));

        expect(runRequestMock).toHaveBeenCalledTimes(3);
      });
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
