import { map, of, Subject, switchMap } from 'rxjs';

import {
  getDefaultTimeRange,
  LoadingState,
  toDataFrame,
  PanelData,
  DataQueryRequest,
  DataSourceApi,
  arrayToDataFrame,
  DataTopic,
  DataFrame,
  DataTransformerConfig,
} from '@grafana/data';

import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';

import { SceneDataNode } from '../core/SceneDataNode';
import { SceneDataTransformer } from './SceneDataTransformer';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { CustomTransformOperator, CustomTransformerDefinition, SceneObjectState } from '../core/types';
import { mockTransformationsRegistry } from '../utils/mockTransformationsRegistry';
import { SceneQueryRunner } from './SceneQueryRunner';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { subscribeToStateUpdates } from '../../utils/test/utils';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TextBoxVariable } from '../variables/variants/TextBoxVariable';
import { activateFullSceneTree } from '../utils/test/activateFullSceneTree';
import { SystemTransformationsProvider } from './SystemTransformationProvider';

class TestSceneObject extends SceneObjectBase<{}> {}

interface TestProviderState extends SceneObjectState {
  child?: SceneDataTransformer;
  resolve?: (ctx: { series: DataFrame[] }) => {
    prepend?: Array<DataTransformerConfig | CustomTransformerDefinition>;
    append?: Array<DataTransformerConfig | CustomTransformerDefinition>;
  };
}

/** Stands in for the VizPanel that implements the interface in production. */
class TestProvider extends SceneObjectBase<TestProviderState> implements SystemTransformationsProvider {
  public origin = 'plugin';
  public calls: DataFrame[][] = [];
  public subscriptions = 0;
  public unsubscriptions = 0;
  public notify?: () => void;

  public getSystemTransformations(_transformer: SceneDataTransformer, ctx: { series: DataFrame[] }) {
    this.calls.push(ctx.series);

    return this.state.resolve?.(ctx) ?? {};
  }

  public subscribeToSystemTransformationsChanged(_transformer: SceneDataTransformer, callback: () => void) {
    this.subscriptions++;
    this.notify = callback;

    return {
      unsubscribe: () => {
        this.unsubscriptions++;
        this.notify = undefined;
      },
    };
  }
}

const transformer1config = {
  id: 'transformer1',
  options: {
    option: 'value1',
  },
};

const transformer2config = {
  id: 'transformer2',
  options: {
    option: 'value2',
  },
};

const annotationTransformerConfig = {
  id: 'annotationTransformer',
  options: {
    option: 'value3',
  },
  topic: DataTopic.Annotations,
};

export const getCustomTransformOperator = (spy: jest.Mock): CustomTransformOperator => {
  return () => (source) => {
    spy();
    return source.pipe(
      map((data) => {
        return data.map((frame) => {
          return {
            ...frame,
            fields: frame.fields.map((field) => {
              return {
                ...field,
                values: field.values.map((v) => v / 100),
              };
            }),
          };
        });
      })
    );
  };
};

export const getCustomAnnotationTransformOperator = (spy: jest.Mock): CustomTransformerDefinition => {
  return {
    operator: () => (source) => {
      spy();
      return source.pipe(
        map((data) => {
          return data.map((frame) => ({
            ...frame,
            fields: frame.fields.map((field) => ({
              ...field,
              values: field.values.map((v) => v / 10),
            })),
          }));
        })
      );
    },
    topic: DataTopic.Annotations,
  };
};

const getDataSourceMock = jest.fn().mockReturnValue({
  getRef: () => ({ uid: 'test' }),
});

const toAnnotationDataFrame = (frames: DataFrame[]) =>
  frames.map((frame) => ({ ...frame, meta: { ...frame.meta, dataTopic: DataTopic.Annotations } }));

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
    annotations: toAnnotationDataFrame([
      toDataFrame([
        [400, 1],
        [500, 2],
        [600, 3],
      ]),
    ]),
    timeRange: getDefaultTimeRange(),
  })
);

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    return runRequestMock(ds, request);
  },
  getDataSourceSrv: () => {
    return { get: getDataSourceMock };
  },
}));

describe('SceneDataTransformer', () => {
  let customTransformerSpy = jest.fn();
  let transformerSpy = jest.fn();
  let annotationTransformerSpy = jest.fn();

  let sourceDataNode: SceneDataNode;
  let customTransformOperator: CustomTransformOperator;
  customTransformOperator = getCustomTransformOperator(customTransformerSpy);

  let customAnnotationTransformOperator: CustomTransformerDefinition;
  customAnnotationTransformOperator = getCustomAnnotationTransformOperator(customTransformerSpy);

  beforeAll(() => {
    mockTransformationsRegistry([
      {
        id: 'transformer1',
        name: 'Custom Transformer',
        operator: (options) => (source) => {
          transformerSpy(options);
          return source.pipe(
            map((data) => {
              return data.map((frame) => {
                return {
                  ...frame,
                  fields: frame.fields.map((field) => {
                    return {
                      ...field,
                      values: field.values.map((v) => v * 2),
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
          // transformerSpy2(options);
          return source.pipe(
            map((data) => {
              return data.map((frame) => {
                return {
                  ...frame,
                  fields: frame.fields.map((field) => {
                    return {
                      ...field,
                      values: field.values.map((v) => v * 3),
                    };
                  }),
                };
              });
            })
          );
        },
      },
      {
        id: 'annotationTransformer',
        name: 'Custom annotationTransformer',
        operator: (options) => (source) => {
          annotationTransformerSpy(options);
          return source.pipe(
            map((data) => {
              return data.map((frame) => ({
                ...frame,
                fields: frame.fields.map((field) => {
                  return {
                    ...field,
                    values: field.values.map((v) => v + 4),
                  };
                }),
              }));
            })
          );
        },
      },
    ]);
  });

  beforeEach(() => {
    sourceDataNode = new SceneDataNode({
      data: {
        state: LoadingState.Loading,
        timeRange: getDefaultTimeRange(),
        series: [
          toDataFrame([
            [100, 1],
            [200, 2],
            [300, 3],
          ]),
        ],
        annotations: toAnnotationDataFrame([
          toDataFrame([
            [400, 1],
            [500, 2],
            [600, 3],
          ]),
        ]),
      },
    });

    customTransformOperator = getCustomTransformOperator(customTransformerSpy);
  });

  afterEach(() => {
    customTransformerSpy.mockClear();
    transformerSpy.mockClear();
    annotationTransformerSpy.mockClear();
  });

  it('applies transformations to closest data node', () => {
    const transformationNode = new SceneDataTransformer({
      transformations: [transformer1config, transformer2config, annotationTransformerConfig],
    });

    const consumer = new TestSceneObject({
      $data: transformationNode,
    });

    // @ts-expect-error
    const scene = new SceneFlexLayout({
      $data: sourceDataNode,
      children: [new SceneFlexItem({ body: consumer })],
    });

    sourceDataNode.activate();
    transformationNode.activate();

    // Transforms initial data
    let data = sceneGraph.getData(consumer).state.data;

    expect(data?.series.length).toBe(1);
    expect(data?.series[0].fields).toHaveLength(2);
    expect(data?.series[0].fields[0].values).toEqual([600, 1200, 1800]);
    expect(data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    expect(data?.annotations?.[0].fields[0].values).toEqual([404, 504, 604]);
    expect(data?.annotations?.[0].fields[1].values).toEqual([5, 6, 7]);

    sourceDataNode.setState({
      data: {
        state: LoadingState.Done,
        timeRange: getDefaultTimeRange(),
        series: [
          toDataFrame([
            [10, 10],
            [20, 20],
            [30, 30],
          ]),
        ],
        annotations: toAnnotationDataFrame([
          toDataFrame([
            [40, 10],
            [50, 20],
            [60, 30],
          ]),
        ]),
      },
    });

    // Transforms updated data
    data = sceneGraph.getData(consumer).state.data;

    expect(data?.series[0].fields[0].values).toEqual([60, 120, 180]);
    expect(data?.series[0].fields[1].values).toEqual([60, 120, 180]);
    expect(data?.annotations?.[0].fields[0].values).toEqual([44, 54, 64]);
    expect(data?.annotations?.[0].fields[1].values).toEqual([14, 24, 34]);
  });

  describe('when custom transform operator is used', () => {
    it('applies single custom transformer', () => {
      const transformationNode = new SceneDataTransformer({
        transformations: [customTransformOperator, customAnnotationTransformOperator],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      // Transforms initial data
      let data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(2);

      expect(data?.series.length).toBe(1);
      expect(data?.series[0].fields).toHaveLength(2);
      expect(data?.series[0].fields[0].values).toEqual([1, 2, 3]);
      expect(data?.series[0].fields[1].values).toEqual([0.01, 0.02, 0.03]);
      expect(data?.annotations?.[0].fields[0].values).toEqual([40, 50, 60]);
      expect(data?.annotations?.[0].fields[1].values).toEqual([0.1, 0.2, 0.3]);

      sourceDataNode.setState({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          series: [
            toDataFrame([
              [10, 10],
              [20, 20],
              [30, 30],
            ]),
          ],
          annotations: toAnnotationDataFrame([
            toDataFrame([
              [100, 1],
              [200, 2],
              [300, 3],
            ]),
          ]),
        },
      });

      // Transforms updated data
      data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(4);

      expect(data?.series[0].fields[0].values).toEqual([0.1, 0.2, 0.3]);
      expect(data?.series[0].fields[1].values).toEqual([0.1, 0.2, 0.3]);
      expect(data?.annotations?.[0].fields[0].values).toEqual([10, 20, 30]);
      expect(data?.annotations?.[0].fields[1].values).toEqual([0.1, 0.2, 0.3]);
    });

    it('applies leading custom transformer', () => {
      // divide values by 100, multiply by 2
      const transformationNode = new SceneDataTransformer({
        transformations: [customTransformOperator, transformer1config],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      // Transforms initial data
      let data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);

      expect(data?.series.length).toBe(1);
      expect(data?.series[0].fields).toHaveLength(2);
      expect(data?.series[0].fields[0].values).toEqual([2, 4, 6]);
      expect(data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);

      sourceDataNode.setState({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          series: [
            toDataFrame([
              [10, 10],
              [20, 20],
              [30, 30],
            ]),
          ],
        },
      });

      // Transforms updated data
      data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(2);

      expect(data?.series[0].fields[0].values).toEqual([0.2, 0.4, 0.6]);
      expect(data?.series[0].fields[1].values).toEqual([0.2, 0.4, 0.6]);
    });

    it('applies trailing custom transformer', () => {
      //  multiply by 2, divide values by 100
      const transformationNode = new SceneDataTransformer({
        transformations: [transformer1config, customTransformOperator],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      // Transforms initial data
      let data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);

      expect(data?.series.length).toBe(1);
      expect(data?.series[0].fields).toHaveLength(2);
      expect(data?.series[0].fields[0].values).toEqual([2, 4, 6]);
      expect(data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);

      sourceDataNode.setState({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          series: [
            toDataFrame([
              [10, 10],
              [20, 20],
              [30, 30],
            ]),
          ],
        },
      });

      // Transforms updated data
      data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(2);

      expect(data?.series[0].fields[0].values).toEqual([0.2, 0.4, 0.6]);
      expect(data?.series[0].fields[1].values).toEqual([0.2, 0.4, 0.6]);
    });

    it('applies mixed transforms', () => {
      //  multiply by 2, divide values by 100, multiply by 2, divide values by 100
      const transformationNode = new SceneDataTransformer({
        transformations: [
          customAnnotationTransformOperator,
          annotationTransformerConfig,
          transformer1config,
          customTransformOperator,
          transformer1config,
          customTransformOperator,
        ],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      // Transforms initial data
      let data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(3);

      expect(data?.series.length).toBe(1);
      expect(data?.series[0].fields).toHaveLength(2);
      expect(data?.series[0].fields[0].values).toEqual([0.04, 0.08, 0.12]);
      expect(data?.series[0].fields[1].values).toEqual([0.0004, 0.0008, 0.0012]);
      expect(data?.annotations?.[0].fields[0].values).toEqual([44, 54, 64]);
      expect(data?.annotations?.[0].fields[1].values).toEqual([4.1, 4.2, 4.3]);

      sourceDataNode.setState({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          series: [
            toDataFrame([
              [10, 10],
              [20, 20],
              [30, 30],
            ]),
          ],
          annotations: toAnnotationDataFrame([
            toDataFrame([
              [100, 10],
              [200, 20],
              [300, 30],
            ]),
          ]),
        },
      });

      // Transforms updated data
      data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(6);

      expect(data?.series[0].fields[0].values).toEqual([0.004, 0.008, 0.012]);
      expect(data?.series[0].fields[1].values).toEqual([0.004, 0.008, 0.012]);
      expect(data?.annotations?.[0].fields[0].values).toEqual([14, 24, 34]);
      expect(data?.annotations?.[0].fields[1].values).toEqual([5, 6, 7]);
    });
  });

  it('Never returns untransformed data', () => {
    //  multiply by 2, divide values by 100, multiply by 2, divide values by 100
    const transformationNode = new SceneDataTransformer({
      transformations: [annotationTransformerConfig, transformer1config],
      $data: sourceDataNode,
    });

    transformationNode.activate();

    const stateUpdates = subscribeToStateUpdates(transformationNode);

    sourceDataNode.setState({
      data: {
        state: LoadingState.Done,
        timeRange: getDefaultTimeRange(),
        series: [toDataFrame([[10, 10]])],
        annotations: toAnnotationDataFrame([toDataFrame([[100, 10]])]),
      },
    });

    const data = stateUpdates[0].data;
    // Verify series are transformed
    expect(data?.series[0].fields[0].values[0]).toBe(10 * 2);
    // Verify annotations are transformed
    expect(data?.annotations?.[0].fields[0].values[0]).toBe(100 + 4);
  });

  it('includes annotations when there are no annotation transformations', () => {
    //  multiply by 2, divide values by 100, multiply by 2, divide values by 100
    const transformationNode = new SceneDataTransformer({
      transformations: [transformer1config],
      $data: sourceDataNode,
    });

    transformationNode.activate();

    const stateUpdates = subscribeToStateUpdates(transformationNode);

    sourceDataNode.setState({
      data: {
        state: LoadingState.Done,
        timeRange: getDefaultTimeRange(),
        series: [toDataFrame([[10, 10]])],
        annotations: toAnnotationDataFrame([toDataFrame([[100, 10]])]),
      },
    });

    const data = stateUpdates[0].data;
    // Verify series are transformed
    expect(data?.series[0].fields[0].values[0]).toBe(10 * 2);
    // Verify annotations are passed through as-is
    expect(data?.annotations?.[0].fields[0].values[0]).toBe(100);
  });

  describe('With inner query runner', () => {
    it('should apply transformations to query results', async () => {
      const queryRunner = new SceneDataTransformer({
        $data: new SceneQueryRunner({
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
      expect(queryRunner.state.data?.series[0].fields[0].values).toEqual([600, 1200, 1800]);
      expect(queryRunner.state.data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });

    describe('custom transformer object', () => {
      it('Can re-trigger transformations without issuing new query', async () => {
        const someObject = new SceneObjectSearchBox({ value: 'hello' });

        const queryRunner = new SceneDataTransformer({
          $data: new SceneQueryRunner({
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
        someObject.subscribeToState(() => queryRunner.reprocessTransformations());

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

    describe('Can subscribe to data via getResultStream', () => {
      it('Should get update even when there are not transforms', async () => {
        const transformer = new SceneDataTransformer({
          $data: new SceneDataNode({
            data: {
              state: LoadingState.Loading,
              timeRange: getDefaultTimeRange(),
              series: [arrayToDataFrame([1, 2, 3])],
            },
          }),
          transformations: [],
        });

        let panelData: PanelData | undefined;
        transformer.getResultsStream().subscribe((result) => {
          panelData = result.data;
        });

        transformer.activate();

        await new Promise((r) => setTimeout(r, 1));

        expect(panelData?.series[0].fields[0].values).toEqual([1, 2, 3]);
      });
    });
  });

  describe('Only transform data when there is new data received', () => {
    it('When data is the same on second activation', async () => {
      const transformer = new SceneDataTransformer({
        $data: new SceneDataNode({
          data: {
            state: LoadingState.Done,
            timeRange: getDefaultTimeRange(),
            series: [arrayToDataFrame([1, 2, 3])],
          },
        }),
        transformations: [customTransformOperator],
      });

      const deactivate = transformer.activate();

      await new Promise((r) => setTimeout(r, 1));

      deactivate();

      transformer.activate();
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);

      const clone = transformer.clone();
      clone.activate();
      expect(customTransformerSpy).toHaveBeenCalledTimes(2);
    });
    it('When series and annotations are the same but loading state is not', async () => {
      const dataNode = new SceneDataNode({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          series: [arrayToDataFrame([1, 2, 3])],
        },
      });

      const transformer = new SceneDataTransformer({
        $data: dataNode,
        transformations: [customTransformOperator],
      });

      const results: PanelData[] = [];
      transformer.getResultsStream().subscribe((result) => {
        results.push(result.data);
      });

      transformer.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(results).toHaveLength(1);
      expect(results[0].state).toBe(LoadingState.Done);

      dataNode.setState({ data: { ...dataNode.state.data, state: LoadingState.Loading } });

      await new Promise((r) => setTimeout(r, 1));

      expect(customTransformerSpy).toHaveBeenCalledTimes(1);
      expect(transformer.state.data?.state).toBe(LoadingState.Loading);
      expect(results).toHaveLength(2);
      expect(results[1].state).toBe(LoadingState.Loading);
      expect(results[1].series).toBe(results[0].series);
    });

    it('emits updated metadata when transformed frame references are unchanged', async () => {
      const series = [arrayToDataFrame([1, 2, 3])];
      const annotations: DataFrame[] = [];
      const dataNode = new SceneDataNode({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          request: { requestId: 'SQR100' } as DataQueryRequest,
          series,
          annotations,
        },
      });

      const transformer = new SceneDataTransformer({
        $data: dataNode,
        transformations: [customTransformOperator],
      });

      const results: PanelData[] = [];
      transformer.getResultsStream().subscribe((result) => {
        results.push(result.data);
      });

      transformer.activate();

      await new Promise((r) => setTimeout(r, 1));

      const initialResult = results[0];

      dataNode.setState({
        data: {
          ...dataNode.state.data,
          state: LoadingState.Loading,
          request: { requestId: 'SQR101' } as DataQueryRequest,
        },
      });

      await new Promise((r) => setTimeout(r, 1));

      expect(customTransformerSpy).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
      expect(results[1].state).toBe(LoadingState.Loading);
      expect(results[1].request?.requestId).toBe('SQR101');
      expect(results[1].series).toBe(initialResult.series);
      expect(results[1].annotations).toBe(initialResult.annotations);
    });

    it('does not emit when transformed frame references and metadata are unchanged', async () => {
      const series = [arrayToDataFrame([1, 2, 3])];
      const annotations: DataFrame[] = [];
      const dataNode = new SceneDataNode({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          request: { requestId: 'SQR100' } as DataQueryRequest,
          series,
          annotations,
        },
      });

      const transformer = new SceneDataTransformer({
        $data: dataNode,
        transformations: [customTransformOperator],
      });

      const results: PanelData[] = [];
      transformer.getResultsStream().subscribe((result) => {
        results.push(result.data);
      });

      transformer.activate();

      await new Promise((r) => setTimeout(r, 1));

      dataNode.setState({
        data: {
          ...dataNode.state.data,
        },
      });

      await new Promise((r) => setTimeout(r, 1));

      expect(customTransformerSpy).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
    });
  });

  describe('passthrough state churn', () => {
    it('does not publish a state change when the passthrough data is unchanged', () => {
      const transformationNode = new SceneDataTransformer({ $data: sourceDataNode, transformations: [] });

      transformationNode.activate();

      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);

      const stateChanges: PanelData[] = [];
      transformationNode.subscribeToState((state) => stateChanges.push(state.data!));

      // Any source state change re-runs transform, whether or not it touched the data
      sourceDataNode.setState({ data: sourceDataNode.state.data });

      expect(stateChanges).toHaveLength(0);
    });

    it('still publishes when the passthrough data actually changes', () => {
      const transformationNode = new SceneDataTransformer({ $data: sourceDataNode, transformations: [] });

      transformationNode.activate();

      const stateChanges: PanelData[] = [];
      transformationNode.subscribeToState((state) => stateChanges.push(state.data!));

      const nextData = { ...sourceDataNode.state.data, series: [toDataFrame([[100, 5]])] };
      sourceDataNode.setState({ data: nextData });

      expect(stateChanges).toHaveLength(1);
      expect(transformationNode.state.data).toBe(nextData);
    });

    it('publishes when the source hands over an equal but distinct data object', () => {
      const transformationNode = new SceneDataTransformer({ $data: sourceDataNode, transformations: [] });

      transformationNode.activate();

      const stateChanges: PanelData[] = [];
      transformationNode.subscribeToState((state) => stateChanges.push(state.data!));

      // The guard is reference identity, not structural: deep comparing every frame on each source state
      // change would cost more than the no-op event it saves, and state.data should track the object the
      // source is actually holding
      sourceDataNode.setState({ data: { ...sourceDataNode.state.data } });

      expect(stateChanges).toHaveLength(1);
    });

    it('still emits on the results stream when the data is unchanged', () => {
      const transformationNode = new SceneDataTransformer({ $data: sourceDataNode, transformations: [] });

      const emissions: PanelData[] = [];
      transformationNode.getResultsStream().subscribe((result) => emissions.push(result.data));

      transformationNode.activate();

      expect(emissions).toHaveLength(1);

      // Subscribers there track source emissions rather than state transitions, so the guard on setState
      // must not silence them
      sourceDataNode.setState({ data: sourceDataNode.state.data });

      expect(emissions).toHaveLength(2);
    });
  });

  describe('when the pipeline becomes empty while a pass is in flight', () => {
    // Passes the test decides when to finish. Transformations are asynchronous in general - a custom
    // operator can emit whenever it likes, and newer @grafana/data resolves standard transformations
    // through a dynamic import - so a pass can still be running when the next one starts.
    function heldPasses() {
      const gates: Array<Subject<DataFrame[]>> = [];

      const operator: CustomTransformOperator = () => (source) =>
        source.pipe(
          switchMap(() => {
            const gate = new Subject<DataFrame[]>();
            gates.push(gate);
            return gate;
          })
        );

      // Finishes the oldest pass still waiting, emitting the given frames as its result
      const finish = (series: DataFrame[]) => {
        const gate = gates.shift()!;
        gate.next(series);
        gate.complete();
      };

      return { operator, finish };
    }

    it('abandons it when the last user transformation is removed', () => {
      const { operator, finish } = heldPasses();

      const transformationNode = new SceneDataTransformer({
        $data: sourceDataNode,
        transformations: [operator],
      });

      transformationNode.activate();

      // Still running, so nothing has been emitted yet
      expect(transformationNode.state.data).toBeUndefined();

      transformationNode.setState({ transformations: [] });
      transformationNode.reprocessTransformations();

      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);

      finish([toDataFrame([[100, 999]])]);

      // The abandoned pass must not overwrite the passthrough with its stale frames
      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);
    });

    it('abandons it when the provider stops contributing', () => {
      const { operator, finish } = heldPasses();
      let contributes = true;

      const transformationNode = new SceneDataTransformer({
        $data: sourceDataNode,
        transformations: [],
      });

      new TestProvider({
        child: transformationNode,
        resolve: () => (contributes ? { append: [operator] } : {}),
      });

      transformationNode.activate();

      expect(transformationNode.state.data).toBeUndefined();

      // Switching to a plugin that registers nothing is exactly this transition
      contributes = false;
      transformationNode.reprocessTransformations();

      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);

      finish([toDataFrame([[100, 999]])]);

      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);
    });

    it('leaves it running when a source state change repeats data already transformed', () => {
      const { operator, finish } = heldPasses();

      const transformationNode = new SceneDataTransformer({
        $data: sourceDataNode,
        transformations: [operator],
      });

      transformationNode.activate();
      finish([toDataFrame([[100, 7]])]);

      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([7]);

      // A forced pass, mid flight
      transformationNode.reprocessTransformations();

      // Any source state change re-runs transform with the same data, which returns early because it has
      // already been transformed. Cancelling the forced pass there would silently drop it.
      sourceDataNode.setState({ data: sourceDataNode.state.data });

      finish([toDataFrame([[100, 8]])]);

      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([8]);
    });
  });

  it('interpolates transformation options before applying', () => {
    const transformationNode = new SceneDataTransformer({
      transformations: [
        {
          ...transformer1config,
          options: {
            options: '$myVariable',
          },
        },
        {
          ...annotationTransformerConfig,
          options: {
            options: 'annotation-transformation-$myVariable',
          },
        },
      ],
    });

    const consumer = new TestSceneObject({
      $data: transformationNode,
    });

    const textVar = new TextBoxVariable({ name: 'myVariable', value: 'Text Variable Value' });
    const scene = new SceneFlexLayout({
      $data: sourceDataNode,
      $variables: new SceneVariableSet({ variables: [textVar] }),
      children: [new SceneFlexItem({ body: consumer })],
    });

    activateFullSceneTree(scene);

    expect(transformerSpy).toHaveBeenCalledTimes(1);
    expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'Text Variable Value' });
    expect(annotationTransformerSpy).toHaveBeenCalledTimes(1);
    expect(annotationTransformerSpy).toHaveBeenLastCalledWith({
      options: 'annotation-transformation-Text Variable Value',
    });

    textVar.setValue('New Text Variable Value');

    expect(transformerSpy).toHaveBeenCalledTimes(2);
    expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'New Text Variable Value' });
    expect(annotationTransformerSpy).toHaveBeenCalledTimes(2);
    expect(annotationTransformerSpy).toHaveBeenLastCalledWith({
      options: 'annotation-transformation-New Text Variable Value',
    });
  });
  describe('variable interpolation with custom transform operators', () => {
    function buildScene(transformations: Array<DataTransformerConfig | CustomTransformerDefinition>) {
      const transformationNode = new SceneDataTransformer({ transformations });
      const consumer = new TestSceneObject({ $data: transformationNode });
      const textVar = new TextBoxVariable({ name: 'myVariable', value: 'Text Variable Value' });

      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        $variables: new SceneVariableSet({ variables: [textVar] }),
        children: [new SceneFlexItem({ body: consumer })],
      });

      activateFullSceneTree(scene);

      return { transformationNode, consumer, textVar };
    }

    const configWithVariable = { ...transformer1config, options: { options: '$myVariable' } };

    it('does not drop object form custom transformer operators', () => {
      // JSON stringifying the object form alongside the configs would drop `operator`
      const { consumer, textVar } = buildScene([configWithVariable, customAnnotationTransformOperator]);

      expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'Text Variable Value' });
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);

      const data = sceneGraph.getData(consumer).state.data;
      // series: value * 2 (interpolated config still applied)
      expect(data?.series[0].fields[1].values).toEqual([2, 4, 6]);
      // annotations: value / 10 (custom operator survived interpolation)
      expect(data?.annotations?.[0].fields[1].values).toEqual([0.1, 0.2, 0.3]);

      // The operator has to survive every re-interpolation, not just the first
      textVar.setValue('New Text Variable Value');

      expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'New Text Variable Value' });
      expect(customTransformerSpy).toHaveBeenCalledTimes(2);

      const updated = sceneGraph.getData(consumer).state.data;
      expect(updated?.series[0].fields[1].values).toEqual([2, 4, 6]);
      expect(updated?.annotations?.[0].fields[1].values).toEqual([0.1, 0.2, 0.3]);
    });

    it('does not drop bare custom transform operators', () => {
      const { consumer, textVar } = buildScene([configWithVariable, customTransformOperator]);

      expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'Text Variable Value' });
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);

      // value * 2 / 100
      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);

      textVar.setValue('New Text Variable Value');

      expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'New Text Variable Value' });
      expect(customTransformerSpy).toHaveBeenCalledTimes(2);
      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);
    });
  });

  describe('system transformations', () => {
    function buildScene({
      transformations = [transformer1config] as Array<DataTransformerConfig | CustomTransformerDefinition>,
      provider = new TestProvider({}),
    } = {}) {
      const transformationNode = new SceneDataTransformer({ $data: sourceDataNode, transformations });

      provider.setState({ child: transformationNode });

      sourceDataNode.activate();

      return { transformationNode, provider, activate: () => transformationNode.activate() };
    }

    it('applies the transformations its parent provides, without any registration call', () => {
      const provider = new TestProvider({
        // +4 (registry operator, no topic so it applies to series)
        resolve: () => ({ prepend: [{ id: 'annotationTransformer', options: {} }], append: [transformer2config] }),
      });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      // (value + 4) * 2 * 3
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([30, 36, 42]);
    });

    it('never puts what the provider contributes into state', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      expect(transformationNode.state.transformations).toEqual([transformer1config]);
    });

    it('is part of the first pass rather than a corrective second one', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });
      const { transformationNode, activate } = buildScene({ provider });

      const dataUpdates = subscribeToStateUpdates(transformationNode);

      activate();

      expect(dataUpdates).toHaveLength(1);
      // value * 2 * 3, from the very first emission
      expect(dataUpdates[0].data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });

    it('resolves against the source frames rather than the pipeline output', () => {
      const provider = new TestProvider({});
      const { activate } = buildScene({ provider });

      activate();

      expect(provider.calls).toHaveLength(1);
      // The source values, not the *2 the user transformation produces
      expect(provider.calls[0][0].fields[1].values).toEqual([1, 2, 3]);
    });

    it('resolves the provider once per pass, sharing the memo with getResolvedSystemTransformations', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      expect(provider.calls).toHaveLength(1);

      transformationNode.getResolvedSystemTransformations();
      transformationNode.getResolvedSystemTransformations();

      expect(provider.calls).toHaveLength(1);
    });

    it('reports what is running, tagged with origin and position', () => {
      const provider = new TestProvider({
        resolve: () => ({ prepend: [transformer1config], append: [transformer2config] }),
      });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      expect(transformationNode.getResolvedSystemTransformations()).toEqual({
        prepend: [{ ...transformer1config, origin: 'plugin', position: 'prepend' }],
        append: [{ ...transformer2config, origin: 'plugin', position: 'append' }],
      });
    });

    it('wraps a bare custom transform operator so that it carries the origin and the series topic', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [customTransformOperator] }) });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      expect(transformationNode.getResolvedSystemTransformations().append).toEqual([
        { operator: customTransformOperator, topic: DataTopic.Series, origin: 'plugin', position: 'append' },
      ]);
      // value * 2 / 100
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);
    });

    it('honours the topic of what the provider contributes', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [annotationTransformerConfig] }) });
      const { transformationNode, activate } = buildScene({ provider, transformations: [] });

      activate();

      // Series untouched, annotations +4
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([1, 2, 3]);
      expect(transformationNode.state.data?.annotations?.[0].fields[1].values).toEqual([5, 6, 7]);
    });

    it('uses a different origin when the provider declares one', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });
      provider.origin = 'test-origin';

      const { transformationNode, activate } = buildScene({ provider });

      activate();

      expect(transformationNode.getResolvedSystemTransformations().append).toEqual([
        { ...transformer2config, origin: 'test-origin', position: 'append' },
      ]);
    });

    it('reprocesses when the provider signals a change without new data', () => {
      let contributes = false;
      const provider = new TestProvider({ resolve: () => (contributes ? { append: [transformer2config] } : {}) });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      // value * 2
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([2, 4, 6]);

      contributes = true;
      provider.notify!();

      // value * 2 * 3
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });

    it('unsubscribes from the provider on deactivation', () => {
      const provider = new TestProvider({});
      const { activate } = buildScene({ provider });

      const deactivate = activate();

      expect(provider.subscriptions).toBe(1);
      expect(provider.unsubscriptions).toBe(0);

      deactivate();

      expect(provider.unsubscriptions).toBe(1);
    });

    it('keeps answering after deactivation, and does not double register on re-activation', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });
      const { transformationNode, activate } = buildScene({ provider });

      activate()();

      // The transformations editor reads this for panels that are not currently rendering
      expect(transformationNode.getResolvedSystemTransformations().append).toEqual([
        { ...transformer2config, origin: 'plugin', position: 'append' },
      ]);

      activate();

      expect(provider.subscriptions).toBe(2);
      expect(transformationNode.getResolvedSystemTransformations().append).toHaveLength(1);
      // Not applied twice
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });

    it('does not discover a provider through a nested transformer', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });

      const inner = new SceneDataTransformer({ $data: sourceDataNode, transformations: [] });
      const outer = new SceneDataTransformer({ $data: inner, transformations: [transformer1config] });

      provider.setState({ child: outer });

      sourceDataNode.activate();
      outer.activate();

      expect(inner.getResolvedSystemTransformations()).toEqual({ prepend: [], append: [] });
      // *3 applied once by the outer transformer, not once per transformer
      expect(outer.state.data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });

    it('ignores a parent that is not a provider', () => {
      const transformationNode = new SceneDataTransformer({ $data: sourceDataNode, transformations: [] });
      const parent = new TestSceneObject({ $data: transformationNode });

      sourceDataNode.activate();
      transformationNode.activate();

      expect(parent).toBeDefined();
      expect(transformationNode.getResolvedSystemTransformations()).toEqual({ prepend: [], append: [] });
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([1, 2, 3]);
    });

    it('does not throw when it has no parent at all', () => {
      const transformationNode = new SceneDataTransformer({ $data: sourceDataNode, transformations: [] });

      sourceDataNode.activate();

      expect(() => transformationNode.activate()).not.toThrow();
      expect(transformationNode.getResolvedSystemTransformations()).toEqual({ prepend: [], append: [] });
    });

    it('answers without a source to resolve against, for an editor reading a detached transformer', () => {
      const detached = new SceneDataTransformer({ transformations: [] });

      expect(detached.getResolvedSystemTransformations()).toEqual({ prepend: [], append: [] });
    });

    it('answers rather than throwing once its provider parent leaves the layout', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });
      const transformationNode = new SceneDataTransformer({ transformations: [] });

      provider.setState({ child: transformationNode });

      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: provider })],
      });

      activateFullSceneTree(scene);

      // The provider is kept across deactivation so editors can read a panel that is not rendering, and a
      // panel removed from the layout is exactly that. It takes the walkable source data with it, leaving
      // this transformer with neither `$data` nor a grandparent - what getSourceData throws on.
      provider.clearParent();

      expect(() => transformationNode.getResolvedSystemTransformations()).not.toThrow();
      // Resolved against no frames rather than refusing to answer
      expect(provider.calls[provider.calls.length - 1]).toEqual([]);
      expect(transformationNode.getResolvedSystemTransformations().append).toEqual([
        { ...transformer2config, origin: 'plugin', position: 'append' },
      ]);
    });

    it('resolves against empty frames when the source has no data yet', () => {
      const provider = new TestProvider({});
      const emptySource = new SceneDataNode({ data: undefined });
      const transformationNode = new SceneDataTransformer({ $data: emptySource, transformations: [] });

      provider.setState({ child: transformationNode });
      transformationNode.activate();

      expect(transformationNode.getResolvedSystemTransformations()).toEqual({ prepend: [], append: [] });
      expect(provider.calls[0]).toEqual([]);
    });

    it('keeps the passthrough fast path when the provider contributes nothing', () => {
      const provider = new TestProvider({});
      const { transformationNode, activate } = buildScene({ provider, transformations: [] });

      activate();

      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);
    });

    it('degrades a throwing provider to a no-op instead of erroring the stream', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const provider = new TestProvider({
        resolve: () => {
          throw new Error('boom');
        },
      });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      // value * 2 - the user transformation still ran
      expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([2, 4, 6]);
      expect(transformationNode.state.data?.state).not.toBe(LoadingState.Error);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('discovers the provider on the clone rather than inheriting the original', () => {
      const provider = new TestProvider({ resolve: () => ({ append: [transformer2config] }) });
      const { transformationNode, activate } = buildScene({ provider });

      activate();

      const clone = transformationNode.clone();
      const otherProvider = new TestProvider({});
      otherProvider.setState({ child: clone });

      clone.activate();

      expect(clone.getResolvedSystemTransformations()).toEqual({ prepend: [], append: [] });
      expect(otherProvider.subscriptions).toBe(1);
    });

    describe('variable interpolation', () => {
      const configWithVariable = { ...transformer1config, options: { options: '$myVariable' } };

      // transformDataFrame runs every option string through ctx.interpolate itself, and only skips that
      // when a scene is registered on the window - its way of deferring to the interpolation scenes has
      // already done. EmbeddedScene/SceneApp set it in a real app; these tests build a bare layout, so
      // without it the compat path resolves both tiers and there is no way to tell them apart.
      beforeEach(() => {
        (window as any).__grafanaSceneContext = {};
      });

      afterEach(() => {
        delete (window as any).__grafanaSceneContext;
      });

      function buildInterpolationScene(
        provider: TestProvider,
        transformations: Array<DataTransformerConfig | CustomTransformerDefinition>
      ) {
        const transformationNode = new SceneDataTransformer({ transformations });
        const textVar = new TextBoxVariable({ name: 'myVariable', value: 'Text Variable Value' });

        provider.setState({ child: transformationNode });

        const scene = new SceneFlexLayout({
          $data: sourceDataNode,
          $variables: new SceneVariableSet({ variables: [textVar] }),
          children: [new SceneFlexItem({ body: provider })],
        });

        activateFullSceneTree(scene);

        return { transformationNode, textVar };
      }

      it('does not drop provider contributed custom transform operators', () => {
        // Interpolation JSON round trips the configs, which would drop a bare operator - the wrapping
        // toSystemTransformation does is what keeps it out of that path
        const provider = new TestProvider({ resolve: () => ({ append: [customTransformOperator] }) });
        const { transformationNode, textVar } = buildInterpolationScene(provider, [configWithVariable]);

        expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'Text Variable Value' });
        expect(customTransformerSpy).toHaveBeenCalledTimes(1);

        // value * 2 / 100
        expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);

        // The operator has to survive every re-interpolation, not just the first
        textVar.setValue('New Text Variable Value');

        expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'New Text Variable Value' });
        expect(customTransformerSpy).toHaveBeenCalledTimes(2);
        expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);
      });

      it('does not re-run for a variable that only provider output references', () => {
        // The dependency config scans state.transformations, which provider output never enters, so a
        // provider whose configs reference variables has to resolve them itself.
        const provider = new TestProvider({ resolve: () => ({ append: [configWithVariable] }) });
        const { textVar } = buildInterpolationScene(provider, []);

        expect(transformerSpy).toHaveBeenCalledTimes(1);
        expect(transformerSpy).toHaveBeenLastCalledWith({ options: '$myVariable' });

        textVar.setValue('New Text Variable Value');

        expect(transformerSpy).toHaveBeenCalledTimes(1);
      });

      it('leaves provider output literal even when a user transformation references a variable', () => {
        // Both tiers carry the same `$myVariable` config. Interpolating the merged array would resolve the
        // provider's copy too, making its behaviour depend on whether the user's own configs happen to
        // reference a variable - the thing that decides whether interpolation runs at all.
        const provider = new TestProvider({ resolve: () => ({ append: [configWithVariable] }) });
        const { textVar } = buildInterpolationScene(provider, [configWithVariable]);

        expect(transformerSpy).toHaveBeenCalledWith({ options: 'Text Variable Value' });
        expect(transformerSpy).toHaveBeenCalledWith({ options: '$myVariable' });

        transformerSpy.mockClear();
        textVar.setValue('New Text Variable Value');

        expect(transformerSpy).toHaveBeenCalledWith({ options: 'New Text Variable Value' });
        expect(transformerSpy).toHaveBeenCalledWith({ options: '$myVariable' });
      });
    });
  });

  describe('Series <-> Annotations conversion', () => {
    it('should convert series frames to annotation frames', () => {
      // Custom transformer that converts series frames to annotation frames
      // This creates both the original series AND annotation copies
      const seriesToAnnotationsTransformer = () => (source: any) => {
        return source.pipe(
          map((data: DataFrame[]) => {
            return data.map((frame: DataFrame) => ({
              ...frame,
              meta: {
                ...frame.meta,
                dataTopic: DataTopic.Annotations,
              },
            }));
          })
        );
      };

      const transformationNode = new SceneDataTransformer({
        transformations: [seriesToAnnotationsTransformer],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      const data = sceneGraph.getData(consumer).state.data;

      expect({ series: data?.series, annotations: data?.annotations }).toEqual({
        series: [],
        annotations: [
          {
            fields: [
              { name: '0', config: {}, values: [100, 200, 300], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
            meta: { dataTopic: 'annotations' },
          },
          {
            fields: [
              { name: '0', config: {}, values: [400, 500, 600], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
            meta: { dataTopic: 'annotations' },
          },
        ],
      });
    });

    it('should convert annotation frames to series frames', () => {
      // Custom transformer that converts annotation frames to series frames
      const annotationsToSeriesTransformer: CustomTransformerDefinition = {
        operator: () => (source) => {
          return source.pipe(
            map((data) => {
              return data.map((frame) => ({
                ...frame,
                meta: {
                  ...frame.meta,
                  dataTopic: undefined, // Remove annotation topic to make it a series frame
                },
              }));
            })
          );
        },
        topic: DataTopic.Annotations,
      };

      const transformationNode = new SceneDataTransformer({
        transformations: [annotationsToSeriesTransformer],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      const data = sceneGraph.getData(consumer).state.data;

      expect({ series: data?.series, annotations: data?.annotations }).toEqual({
        series: [
          {
            fields: [
              { name: '0', config: {}, values: [100, 200, 300], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
          },
          {
            fields: [
              { name: '0', config: {}, values: [400, 500, 600], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
            meta: {},
          },
        ],
        annotations: [],
      });
    });

    it('should handle mixed transformations with series and annotation conversions', () => {
      // Transformer that converts series to annotations
      const seriesToAnnotationsTransformer = () => (source: any) => {
        return source.pipe(
          map((data: DataFrame[]) => {
            return data.map((frame: DataFrame) => ({
              ...frame,
              meta: {
                ...frame.meta,
                dataTopic: DataTopic.Annotations,
              },
            }));
          })
        );
      };

      // Transformer that converts annotations to series
      const annotationsToSeriesTransformer: CustomTransformerDefinition = {
        operator: () => (source) => {
          return source.pipe(
            map((data) => {
              return data.map((frame) => ({
                ...frame,
                meta: {
                  ...frame.meta,
                  dataTopic: undefined,
                },
              }));
            })
          );
        },
        topic: DataTopic.Annotations,
      };

      const transformationNode = new SceneDataTransformer({
        transformations: [seriesToAnnotationsTransformer, annotationsToSeriesTransformer],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      const data = sceneGraph.getData(consumer).state.data;

      expect({ series: data?.series, annotations: data?.annotations }).toEqual({
        series: [
          {
            fields: [
              { name: '0', config: {}, values: [400, 500, 600], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
            meta: {},
          },
        ],
        annotations: [
          {
            fields: [
              { name: '0', config: {}, values: [100, 200, 300], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
            meta: { dataTopic: 'annotations' },
          },
        ],
      });
    });

    it('should preserve original data when no conversion occurs', () => {
      // Transformer that doesn't change dataTopic
      const preservingTransformer = () => (source: any) => {
        return source.pipe(
          map((data: DataFrame[]) => {
            return data.map((frame: DataFrame) => ({
              ...frame,
            }));
          })
        );
      };

      const preservingAnnotationTransformer: CustomTransformerDefinition = {
        operator: () => (source) => {
          return source.pipe(
            map((data) => {
              return data.map((frame) => ({
                ...frame,
              }));
            })
          );
        },
        topic: DataTopic.Annotations,
      };

      const transformationNode = new SceneDataTransformer({
        transformations: [preservingTransformer, preservingAnnotationTransformer],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      const data = sceneGraph.getData(consumer).state.data;

      expect({ series: data?.series, annotations: data?.annotations }).toEqual({
        series: [
          {
            fields: [
              { name: '0', config: {}, values: [100, 200, 300], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
          },
        ],
        annotations: [
          {
            fields: [
              { name: '0', config: {}, values: [400, 500, 600], type: 'number' },
              { name: '1', config: {}, values: [1, 2, 3], type: 'number' },
            ],
            length: 3,
            meta: { dataTopic: 'annotations' },
          },
        ],
      });
    });

    // skip until fixed: https://github.com/grafana/scenes/pull/1207#issuecomment-3258847124
    it.skip('should handle complex conversion chains', () => {
      // First: multiply series values by 2
      // series will become [200,400,600][2,4,6]
      const multiplySeriesTransformer = () => (source: any) => {
        return source.pipe(
          map((data: DataFrame[]) => {
            return data.map((frame: DataFrame) => ({
              ...frame,
              fields: frame.fields.map((field: any) => ({
                ...field,
                values: field.values.map((v: number) => v * 2),
              })),
            }));
          })
        );
      };

      // Second: convert series to annotations
      // annos will become [200,400,600][2,4,6],[400,500,600][1,2,3]
      const seriesToAnnotationsTransformer = () => (source: any) => {
        return source.pipe(
          map((data: DataFrame[]) => {
            return data.map((frame: DataFrame) => ({
              ...frame,
              meta: {
                ...frame.meta,
                dataTopic: DataTopic.Annotations,
              },
            }));
          })
        );
      };

      // Third: add 10 to annotation values
      // annos will become [210,410,610][12,14,16],[410,510,610][11,12,13]
      const addToAnnotationsTransformer: CustomTransformerDefinition = {
        operator: () => (source) => {
          return source.pipe(
            map((data) => {
              return data.map((frame) => ({
                ...frame,
                fields: frame.fields.map((field) => ({
                  ...field,
                  values: field.values.map((v) => v + 10),
                })),
              }));
            })
          );
        },
        topic: DataTopic.Annotations,
      };

      const transformationNode = new SceneDataTransformer({
        transformations: [multiplySeriesTransformer, seriesToAnnotationsTransformer, addToAnnotationsTransformer],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      const data = sceneGraph.getData(consumer).state.data;

      expect({ series: data?.series, annotations: data?.annotations }).toEqual({
        series: [],
        annotations: [
          {
            fields: [
              { name: '0', config: {}, values: [210, 410, 610], type: 'number' },
              { name: '1', config: {}, values: [12, 14, 16], type: 'number' },
            ],
            length: 3,
            meta: { dataTopic: 'annotations' },
          },
          {
            fields: [
              { name: '0', config: {}, values: [410, 510, 610], type: 'number' },
              { name: '1', config: {}, values: [11, 12, 13], type: 'number' },
            ],
            length: 3,
            meta: { dataTopic: 'annotations' },
          },
        ],
      });
    });
  });
});

export interface SceneObjectSearchBoxState extends SceneObjectState {
  value: string;
}

export class SceneObjectSearchBox extends SceneObjectBase<SceneObjectSearchBoxState> {}
