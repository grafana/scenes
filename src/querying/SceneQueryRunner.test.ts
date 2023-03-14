import { map, Observable, of } from 'rxjs';

import {
  ArrayVector,
  DataQueryRequest,
  DataSourceApi,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  toDataFrame,
} from '@grafana/data';

import { SceneTimeRange } from '../core/SceneTimeRange';

import { SceneQueryRunner } from './SceneQueryRunner';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestVariable } from '../variables/variants/TestVariable';
import { getCustomTransformOperator } from '../core/SceneDataTransformer.test';
import { mockTransformationsRegistry } from '../utils/mockTransformationsRegistry';
import {
  DefaultQueryRunnerDataTransformer,
  QueryRunnerWithTransformations,
  ReprocessTransformationsEvent,
  SceneQueryRunnerDataTransformer,
} from './transformations';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectStatePlain, SceneQueryRunnerInterface } from '../core/types';

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
  beforeAll(() => {
    mockTransformationsRegistry([
      {
        id: 'transformer1',
        name: 'Custom Transformer',
        operator: (options) => (source) => {
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
      {
        id: 'transformer2',
        name: 'Custom Transformer2',
        operator: (options) => (source) => {
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
    ]);
  });
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
    let customTransformerSpy = jest.fn();
    let customTransformOperator = getCustomTransformOperator(customTransformerSpy);

    afterEach(() => {
      customTransformerSpy.mockClear();
    });

    it('should apply transformations to query results', async () => {
      const queryRunner = new QueryRunnerWithTransformations({
        queryRunner: new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          maxDataPoints: 100,
        }),
        transformations: [
          {
            id: 'transformer1',
            options: {
              option: 'value1',
            },
          },
          {
            id: 'transformer2',
            options: {
              option: 'value2',
            },
          },
        ],
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(queryRunner.state.data?.series).toHaveLength(1);
      expect(queryRunner.state.data?.series[0].fields).toHaveLength(2);
      expect(queryRunner.state.data?.series[0].fields[0].values.toArray()).toEqual([600, 1200, 1800]);
      expect(queryRunner.state.data?.series[0].fields[1].values.toArray()).toEqual([6, 12, 18]);
    });

    // describe('custom transformations', () => {
    //   it('applies leading custom transformer', async () => {
    //     const queryRunner = new SceneQueryRunner({
    //       queries: [{ refId: 'A' }],
    //       $timeRange: new SceneTimeRange(),
    //       maxDataPoints: 100,
    //       // divide by 100, multiply by 2, multiply by 3
    //       transformer: new DefaultQueryRunnerDataTransformer({
    //         transformations: [
    //           customTransformOperator,
    //           {
    //             id: 'transformer1',
    //             options: {
    //               option: 'value1',
    //             },
    //           },
    //           {
    //             id: 'transformer2',
    //             options: {
    //               option: 'value2',
    //             },
    //           },
    //         ],
    //       }),
    //     });

    //     queryRunner.activate();

    //     await new Promise((r) => setTimeout(r, 1));

    //     expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    //     expect(customTransformerSpy).toHaveBeenCalledTimes(1);
    //     expect(queryRunner.state.data?.series).toHaveLength(1);
    //     expect(queryRunner.state.data?.series[0].fields).toHaveLength(2);
    //     expect(queryRunner.state.data?.series[0].fields[0].values.toArray()).toEqual([6, 12, 18]);
    //     expect(queryRunner.state.data?.series[0].fields[1].values.toArray()).toEqual([0.06, 0.12, 0.18]);
    //   });

    //   it('applies trailing custom transformer', async () => {
    //     const queryRunner = new SceneQueryRunner({
    //       queries: [{ refId: 'A' }],
    //       $timeRange: new SceneTimeRange(),
    //       maxDataPoints: 100,
    //       // multiply by 2, multiply by 3, divide by 100
    //       transformer: new DefaultQueryRunnerDataTransformer({
    //         transformations: [
    //           {
    //             id: 'transformer1',
    //             options: {
    //               option: 'value1',
    //             },
    //           },
    //           {
    //             id: 'transformer2',
    //             options: {
    //               option: 'value2',
    //             },
    //           },
    //           customTransformOperator,
    //         ],
    //       }),
    //     });

    //     queryRunner.activate();

    //     await new Promise((r) => setTimeout(r, 1));

    //     expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    //     expect(customTransformerSpy).toHaveBeenCalledTimes(1);
    //     expect(queryRunner.state.data?.series).toHaveLength(1);
    //     expect(queryRunner.state.data?.series[0].fields).toHaveLength(2);
    //     expect(queryRunner.state.data?.series[0].fields[0].values.toArray()).toEqual([6, 12, 18]);
    //     expect(queryRunner.state.data?.series[0].fields[1].values.toArray()).toEqual([0.06, 0.12, 0.18]);
    //   });

    //   it('applies mixed transforms', async () => {
    //     const queryRunner = new SceneQueryRunner({
    //       queries: [{ refId: 'A' }],
    //       $timeRange: new SceneTimeRange(),
    //       maxDataPoints: 100,
    //       // divide by 100,multiply by 2, divide by 100, multiply by 3, divide by 100
    //       transformer: new DefaultQueryRunnerDataTransformer({
    //         transformations: [
    //           customTransformOperator,
    //           {
    //             id: 'transformer1',
    //             options: {
    //               option: 'value1',
    //             },
    //           },
    //           customTransformOperator,
    //           {
    //             id: 'transformer2',
    //             options: {
    //               option: 'value2',
    //             },
    //           },
    //           customTransformOperator,
    //         ],
    //       }),
    //     });

    //     queryRunner.activate();

    //     await new Promise((r) => setTimeout(r, 1));

    //     expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    //     expect(customTransformerSpy).toHaveBeenCalledTimes(3);
    //     expect(queryRunner.state.data?.series).toHaveLength(1);
    //     expect(queryRunner.state.data?.series[0].fields).toHaveLength(2);
    //     expect(queryRunner.state.data?.series[0].fields[0].values.toArray()).toEqual([0.0006, 0.0012, 0.0018]);
    //     expect(queryRunner.state.data?.series[0].fields[1].values.toArray()).toEqual([0.000006, 0.000012, 0.000018]);
    //   });
    // });

    describe('custom transformer object', () => {
      it('Can re-trigger transformations without issuing new query', async () => {
        const someObject = new SceneObjectSearchBox({ value: 'hello' });

        const queryRunner = new QueryRunnerWithTransformations({
          queryRunner: new SceneQueryRunner({
            queries: [{ refId: 'A' }],
            $timeRange: new SceneTimeRange(),
            maxDataPoints: 100,
          }),
          transformations: [
            () => (source) => {
              return source.pipe(
                map((data) => {
                  //return data;
                  return data.map((frame) => ({ ...frame, name: someObject.state.value }));
                })
              );
            },
          ],
        });

        // This could potentially be done by QueryRunnerWithTransformations if we passed it "dependencies" (object it should subscribe to and re-run transformations on change)
        someObject.subscribeToState({
          next: () => queryRunner.reprocessTransformations(),
        });

        queryRunner.activate();

        await new Promise((r) => setTimeout(r, 1));

        // Verify transformation has run once
        expect(queryRunner.state.data?.series[0].name).toBe('hello');

        // Updates structureRev and re-trigger transformation
        someObject.setState({ value: 'new name' });

        // Need to do this to get rxjs time to update
        await new Promise((r) => setTimeout(r, 1));

        expect(queryRunner.state.data?.series[0].name).toBe('new name');
      });
    });
  });

  describe('When query is using variable that is still loading', () => {
    it('Should not executed query on activate', async () => {
      const variable = new TestVariable({ name: 'A', value: '1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(variable.state.loading).toBe(true);
      expect(queryRunner.state.data?.state).toBe(undefined);
    });

    it('Should not executed query on activate even when maxDataPointsFromWidth is true', async () => {
      const variable = new TestVariable({ name: 'A', value: '1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
        maxDataPointsFromWidth: true,
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      queryRunner.setContainerWidth(1000);

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(undefined);
    });

    it('Should not executed query when time range change', async () => {
      const variable = new TestVariable({ name: 'A', value: '', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      timeRange.onRefresh();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(undefined);
    });

    it('Should execute query when variable updates', async () => {
      const variable = new TestVariable({ name: 'A', value: '', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();
      // should execute query when variable completes update
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      variable.changeValueTo('AB');

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('Should execute query again after variable changed while inactive', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      // should execute query when variable completes update
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // simulate we collapse a part of the scene where this query runner is
      queryRunner.deactivate();

      variable.changeValueTo('AB');

      await new Promise((r) => setTimeout(r, 1));
      // Should not execute query
      expect(runRequestMock.mock.calls.length).toBe(1);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // now activate again it should detect value change and issue new query
      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should execute query a second time
      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('Should execute query again after variable changed while whole scene was inactive', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      // should execute query when variable completes update
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // Deactivate scene which deactivates SceneVariableSet
      scene.deactivate();

      // Now change value
      variable.changeValueTo('AB');
      // Allow rxjs logic time run
      await new Promise((r) => setTimeout(r, 1));
      // Should not execute query
      expect(runRequestMock.mock.calls.length).toBe(1);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // now activate again it should detect value change and issue new query
      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should execute query a second time
      expect(runRequestMock.mock.calls.length).toBe(2);
    });
  });
});

export interface SceneObjectSearchBoxState extends SceneObjectStatePlain {
  value: string;
}

export class SceneObjectSearchBox extends SceneObjectBase<SceneObjectSearchBoxState> {}
