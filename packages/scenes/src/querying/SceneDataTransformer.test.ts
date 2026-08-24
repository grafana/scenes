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
} from '@grafana/data';

import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';

import { SceneDataNode } from '../core/SceneDataNode';
import {
  isSystemTransformation,
  isTransformationFrom,
  SceneDataTransformer,
  SceneDataTransformation,
} from './SceneDataTransformer';
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

class TestSceneObject extends SceneObjectBase<{}> {}

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

// Same +4 registry transformation, left untopiced so that it applies to series
const annotationTransformerConfigNoTopic = {
  id: 'annotationTransformer',
  options: {
    option: 'value3',
  },
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

      transformationNode.setUserTransformations([]);

      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);

      finish([toDataFrame([[100, 999]])]);

      // The abandoned pass must not overwrite the passthrough with its stale frames
      expect(transformationNode.state.data).toBe(sourceDataNode.state.data);
    });

    it('abandons it when a supplier stops contributing', () => {
      const { operator, finish } = heldPasses();
      let contributes = true;

      const transformationNode = new SceneDataTransformer({
        $data: sourceDataNode,
        transformations: [],
      });

      transformationNode.setSystemTransformations({
        supplier: () => (contributes ? { append: [operator] } : {}),
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
    function buildScene(transformations: SceneDataTransformation[]) {
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

    it('interpolates variables inside system transformations', () => {
      const { transformationNode, textVar } = buildScene([]);

      transformationNode.setSystemTransformations({ append: [configWithVariable] });

      expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'Text Variable Value' });

      // The origin tag has to survive alongside the interpolated options
      expect(transformationNode.state.transformations.filter(isSystemTransformation)).toHaveLength(1);

      textVar.setValue('New Text Variable Value');

      expect(transformerSpy).toHaveBeenLastCalledWith({ options: 'New Text Variable Value' });
    });

    it('keeps system custom transform operators when interpolating variables', () => {
      const { transformationNode, consumer, textVar } = buildScene([configWithVariable]);

      // setSystemTransformations wraps the bare operator into the object form a JSON round trip drops
      transformationNode.setSystemTransformations({ append: [customTransformOperator] });

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
    function buildScene() {
      const transformationNode = new SceneDataTransformer({
        transformations: [transformer1config],
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

      return { transformationNode, consumer };
    }

    it('combines prepended and appended transformations with user configured ones', () => {
      const { transformationNode, consumer } = buildScene();

      transformationNode.setSystemTransformations({
        // +4 (registry operator, no topic so it applies to series)
        prepend: [{ id: 'annotationTransformer', options: {} }],
        // *3
        append: [transformer2config],
      });

      expect(transformationNode.state.transformations).toEqual([
        { id: 'annotationTransformer', options: {}, origin: 'plugin', position: 'prepend' },
        transformer1config,
        { ...transformer2config, origin: 'plugin', position: 'append' },
      ]);

      // (value + 4) * 2 * 3 - proves prepend runs before and append after the user transformation
      const data = sceneGraph.getData(consumer).state.data;
      expect(data?.series[0].fields[1].values).toEqual([30, 36, 42]);
    });

    it('replaces previous system transformations on subsequent calls', () => {
      const { transformationNode, consumer } = buildScene();

      transformationNode.setSystemTransformations({
        prepend: [{ id: 'annotationTransformer', options: {} }],
        append: [transformer2config],
      });

      transformationNode.setSystemTransformations({ append: [transformer2config] });

      expect(transformationNode.state.transformations).toEqual([
        transformer1config,
        { ...transformer2config, origin: 'plugin', position: 'append' },
      ]);

      // value * 2 * 3
      const data = sceneGraph.getData(consumer).state.data;
      expect(data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });

    it('clears its own transformations without touching the user configured ones', () => {
      const { transformationNode, consumer } = buildScene();

      // +4 (prepend), *3 (append)
      transformationNode.setSystemTransformations({
        prepend: [{ id: 'annotationTransformer', options: {} }],
        append: [transformer2config],
      });

      expect(transformationNode.state.transformations).toEqual([
        { id: 'annotationTransformer', options: {}, origin: 'plugin', position: 'prepend' },
        transformer1config,
        { ...transformer2config, origin: 'plugin', position: 'append' },
      ]);

      // (value + 4) * 2 * 3
      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([30, 36, 42]);

      // Passing no groups clears this origin
      transformationNode.setSystemTransformations({});

      expect(transformationNode.state.transformations).toEqual([transformer1config]);

      // value * 2
      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([2, 4, 6]);
    });

    it('does not update state when called again with equal transformations', () => {
      const { transformationNode } = buildScene();

      transformationNode.setSystemTransformations({ prepend: [transformer2config] });
      const transformations = transformationNode.state.transformations;

      transformationNode.setSystemTransformations({ prepend: [transformer2config] });

      expect(transformationNode.state.transformations).toBe(transformations);
    });
    it('does not update state when called again with the same custom transform operator reference', () => {
      const { transformationNode } = buildScene();

      transformationNode.setSystemTransformations({ append: [customTransformOperator] });
      const transformations = transformationNode.state.transformations;

      transformationNode.setSystemTransformations({ append: [customTransformOperator] });

      expect(transformationNode.state.transformations).toBe(transformations);
    });

    it('applies system transformations set before activation', () => {
      const transformationNode = new SceneDataTransformer({
        transformations: [transformer1config],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [new SceneFlexItem({ body: consumer })],
      });

      transformationNode.setSystemTransformations({ append: [transformer2config] });

      expect(transformationNode.state.data).toBeUndefined();

      sourceDataNode.activate();
      transformationNode.activate();

      // value * 2 * 3 - the activation handler picks up the transformations set while inactive
      const data = sceneGraph.getData(consumer).state.data;
      expect(data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });
    // Scales every value by `factor`, so a changed closure is observable in the output
    const scaleOperator =
      (factor: number): CustomTransformOperator =>
      () =>
      (source) =>
        source.pipe(
          map((data) =>
            data.map((frame) => ({
              ...frame,
              fields: frame.fields.map((field) => ({ ...field, values: field.values.map((v) => v * factor) })),
            }))
          )
        );

    it('does not re-run the pipeline when an inline operator is re-applied under an unchanged key', () => {
      const { transformationNode } = buildScene();

      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(10), topic: DataTopic.Series, key: 'panel-transformation' }],
      });
      const transformations = transformationNode.state.transformations;

      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(10), topic: DataTopic.Series, key: 'panel-transformation' }],
      });

      expect(transformationNode.state.transformations).toBe(transformations);
    });

    it('settles instead of looping when a caller re-applies inline operators on every data change', () => {
      const { transformationNode } = buildScene();
      const limit = 50;
      let applies = 0;

      transformationNode.subscribeToState((state, prev) => {
        if (state.data !== prev.data && applies < limit) {
          applies++;
          // Built inline on every data change, as a panel would
          transformationNode.setSystemTransformations({
            append: [{ operator: scaleOperator(10), topic: DataTopic.Series, key: 'panel-transformation' }],
          });
        }
      });

      transformationNode.reprocessTransformations();

      // One apply, then the unchanged key makes the follow-up call a no-op. Without the key the new
      // operator reference makes every call re-process and emit, and this never terminates.
      expect(applies).toBe(2);
    });

    it('still re-applies inline operators that carry no key', () => {
      const { transformationNode } = buildScene();

      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(10), topic: DataTopic.Series }],
      });
      const transformations = transformationNode.state.transformations;

      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(10), topic: DataTopic.Series }],
      });

      expect(transformationNode.state.transformations).not.toBe(transformations);
    });

    it('ignores a changed operator under an unchanged key', () => {
      const { transformationNode, consumer } = buildScene();

      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(10), topic: DataTopic.Series, key: 'v1' }],
      });

      // value * 2 * 10
      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([20, 40, 60]);

      // The key is the caller's declaration of identity, so it has to change for a new operator to apply
      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(100), topic: DataTopic.Series, key: 'v1' }],
      });

      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([20, 40, 60]);
    });

    it('re-applies when the key changes', () => {
      const { transformationNode, consumer } = buildScene();

      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(10), topic: DataTopic.Series, key: 'v1' }],
      });

      // value * 2 * 10
      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([20, 40, 60]);

      transformationNode.setSystemTransformations({
        append: [{ operator: scaleOperator(100), topic: DataTopic.Series, key: 'v2' }],
      });

      // value * 2 * 100
      expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([200, 400, 600]);
    });

    it('still detects a changed topic under an unchanged key', () => {
      const { transformationNode } = buildScene();
      const operator = scaleOperator(10);

      transformationNode.setSystemTransformations({
        append: [{ operator, topic: DataTopic.Series, key: 'v1' }],
      });

      transformationNode.setSystemTransformations({
        append: [{ operator, topic: DataTopic.Annotations, key: 'v1' }],
      });

      expect(transformationNode.state.transformations).toEqual([
        transformer1config,
        { operator, topic: DataTopic.Annotations, origin: 'plugin', position: 'append', key: 'v1' },
      ]);
    });

    it('re-applies under an unchanged key when another writer replaced the transformations', () => {
      const { transformationNode } = buildScene();
      const operator = scaleOperator(10);

      transformationNode.setSystemTransformations({
        append: [{ operator, topic: DataTopic.Series, key: 'v1' }],
      });

      // e.g. a transformations editor writing back only the user configured transformations
      transformationNode.setState({ transformations: [transformer1config] });

      transformationNode.setSystemTransformations({
        append: [{ operator, topic: DataTopic.Series, key: 'v1' }],
      });

      expect(transformationNode.state.transformations).toEqual([
        transformer1config,
        { operator, topic: DataTopic.Series, origin: 'plugin', position: 'append', key: 'v1' },
      ]);
    });

    it('matches an origin scoped guard only for that origin', () => {
      const { transformationNode } = buildScene();

      transformationNode.setSystemTransformations({ append: [transformer2config] });

      const [user, system] = transformationNode.state.transformations;

      expect(isSystemTransformation(system)).toBe(true);
      expect(isSystemTransformation(user)).toBe(false);

      // Usable as a predicate, which is why it is curried rather than a second argument
      expect(transformationNode.state.transformations.filter(isTransformationFrom('plugin'))).toEqual([system]);
      expect(transformationNode.state.transformations.filter(isSystemTransformation)).toEqual([system]);
    });

    it('wraps bare custom transform operators so they carry the plugin origin', () => {
      const { transformationNode, consumer } = buildScene();

      transformationNode.setSystemTransformations({ append: [customTransformOperator] });

      expect(transformationNode.state.transformations).toEqual([
        transformer1config,
        { operator: customTransformOperator, topic: DataTopic.Series, origin: 'plugin', position: 'append' },
      ]);
      expect(transformationNode.state.transformations.filter(isSystemTransformation)).toHaveLength(1);

      // value * 2 / 100
      const data = sceneGraph.getData(consumer).state.data;
      expect(data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);
    });
    describe('setUserTransformations', () => {
      it('replaces the user transformations while keeping system ones in place', () => {
        const { transformationNode, consumer } = buildScene();

        // +4 (prepend), *3 (append)
        transformationNode.setSystemTransformations({
          prepend: [{ id: 'annotationTransformer', options: {} }],
          append: [transformer2config],
        });

        // Swap the user transformation from *2 to *3
        transformationNode.setUserTransformations([transformer2config]);

        expect(transformationNode.state.transformations).toEqual([
          { id: 'annotationTransformer', options: {}, origin: 'plugin', position: 'prepend' },
          transformer2config,
          { ...transformer2config, origin: 'plugin', position: 'append' },
        ]);

        // (value + 4) * 3 * 3
        const data = sceneGraph.getData(consumer).state.data;
        expect(data?.series[0].fields[1].values).toEqual([45, 54, 63]);
      });

      it('does not update state when the user transformations are unchanged', () => {
        const { transformationNode } = buildScene();

        transformationNode.setSystemTransformations({ append: [transformer2config] });
        const transformations = transformationNode.state.transformations;

        transformationNode.setUserTransformations([transformer1config]);

        expect(transformationNode.state.transformations).toBe(transformations);
      });

      it('replaces rather than appends on repeated calls', () => {
        const { transformationNode } = buildScene();

        transformationNode.setUserTransformations([transformer2config]);
        transformationNode.setUserTransformations([transformer2config]);

        expect(transformationNode.state.transformations).toEqual([transformer2config]);
      });

      it('drops system transformations passed in with the user ones', () => {
        const { transformationNode, consumer } = buildScene();

        // +4 (prepend), *3 (append)
        transformationNode.setSystemTransformations({
          prepend: [{ id: 'annotationTransformer', options: {} }],
          append: [transformer2config],
        });

        // Callers migrating off setState({ transformations }) may hand back the whole array
        transformationNode.setUserTransformations(transformationNode.state.transformations);
        transformationNode.setUserTransformations(transformationNode.state.transformations);

        expect(transformationNode.state.transformations).toEqual([
          { id: 'annotationTransformer', options: {}, origin: 'plugin', position: 'prepend' },
          transformer1config,
          { ...transformer2config, origin: 'plugin', position: 'append' },
        ]);

        // (value + 4) * 2 * 3 - the runtime transforms ran once, not once per call
        const data = sceneGraph.getData(consumer).state.data;
        expect(data?.series[0].fields[1].values).toEqual([30, 36, 42]);
      });

      it('clears the user transformations without touching system ones', () => {
        const { transformationNode, consumer } = buildScene();

        transformationNode.setSystemTransformations({ append: [transformer2config] });
        transformationNode.setUserTransformations([]);

        expect(transformationNode.state.transformations).toEqual([
          { ...transformer2config, origin: 'plugin', position: 'append' },
        ]);

        // value * 3, the user *2 is gone
        const data = sceneGraph.getData(consumer).state.data;
        expect(data?.series[0].fields[1].values).toEqual([3, 6, 9]);
      });
    });

    describe('multiple origins', () => {
      it('composes both origins into the same tiers, in registration order', () => {
        const transformationNode = new SceneDataTransformer({ transformations: [] });

        const consumer = new TestSceneObject({ $data: transformationNode });

        // @ts-expect-error
        const scene = new SceneFlexLayout({
          $data: sourceDataNode,
          children: [new SceneFlexItem({ body: consumer })],
        });

        sourceDataNode.activate();
        transformationNode.activate();

        // *3 then +4, so the order of the two origins is visible in the result
        transformationNode.setSystemTransformations({ prepend: [transformer2config], origin: 'first' });
        transformationNode.setSystemTransformations({
          prepend: [annotationTransformerConfigNoTopic],
          origin: 'second',
        });

        expect(transformationNode.state.transformations).toEqual([
          { ...transformer2config, origin: 'first', position: 'prepend' },
          { ...annotationTransformerConfigNoTopic, origin: 'second', position: 'prepend' },
        ]);

        // value * 3 + 4, not (value + 4) * 3
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([7, 10, 13]);
      });

      it('replaces one origin without disturbing the other', () => {
        const { transformationNode, consumer } = buildScene();

        transformationNode.setSystemTransformations({ prepend: [annotationTransformerConfigNoTopic], origin: 'first' });
        transformationNode.setSystemTransformations({ append: [transformer2config], origin: 'second' });

        // A second call for an origin that is already in state used to throw here
        transformationNode.setSystemTransformations({ append: [transformer2config], origin: 'second' });
        transformationNode.setSystemTransformations({ origin: 'first' });

        expect(transformationNode.state.transformations).toEqual([
          transformer1config,
          { ...transformer2config, origin: 'second', position: 'append' },
        ]);

        // value * 2 * 3, the first origin's +4 is gone
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([6, 12, 18]);
      });
    });

    describe('supplier', () => {
      function buildSupplierScene(transformations: SceneDataTransformation[] = [transformer1config]) {
        const transformationNode = new SceneDataTransformer({ transformations });

        const consumer = new TestSceneObject({ $data: transformationNode });

        const scene = new SceneFlexLayout({
          $data: sourceDataNode,
          children: [new SceneFlexItem({ body: consumer })],
        });

        const activate = () => {
          sourceDataNode.activate();
          transformationNode.activate();
        };

        // Parents a clone under the same source instead of building a second scene around it, which would
        // give sourceDataNode two parents
        const attach = (node: SceneDataTransformer) => {
          scene.setState({
            children: [...scene.state.children, new SceneFlexItem({ body: new TestSceneObject({ $data: node }) })],
          });
        };

        return { transformationNode, consumer, activate, attach };
      }

      it('runs supplied transformations around the user configured ones', () => {
        const { transformationNode, consumer, activate } = buildSupplierScene();

        transformationNode.setSystemTransformations({
          supplier: () => ({
            // +4
            prepend: [annotationTransformerConfigNoTopic],
            // *3
            append: [transformer2config],
          }),
        });

        activate();

        // (value + 4) * 2 * 3 - same pipeline order as concrete entries
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([30, 36, 42]);
      });

      it('does not put supplied transformations in state', () => {
        const { transformationNode, activate } = buildSupplierScene();

        transformationNode.setSystemTransformations({ supplier: () => ({ append: [transformer2config] }) });
        activate();

        expect(transformationNode.state.transformations).toEqual([transformer1config]);
      });

      it('receives the source frames rather than the pipeline output', () => {
        const { transformationNode, activate } = buildSupplierScene();
        const seen: number[][] = [];

        transformationNode.setSystemTransformations({
          supplier: ({ series }) => {
            seen.push(series[0].fields[1].values);
            // Appended, so it runs after the user *2 but is still resolved from the source frames
            return { append: [transformer2config] };
          },
        });

        activate();

        expect(seen).toEqual([[1, 2, 3]]);
      });

      it('resolves the supplier once per emission', () => {
        const supplierSpy = jest.fn().mockReturnValue({ append: [transformer2config] });
        const { transformationNode, activate } = buildSupplierScene();

        transformationNode.setSystemTransformations({ supplier: supplierSpy });
        activate();

        expect(supplierSpy).toHaveBeenCalledTimes(1);

        // An editor reading the resolution for the frames the pipeline used shares its memo
        const series = sourceDataNode.state.data!.series;
        expect(transformationNode.getResolvedSystemTransformations(series)).toEqual({
          prepend: [],
          append: [{ ...transformer2config, origin: 'plugin', position: 'append' }],
        });
        expect(supplierSpy).toHaveBeenCalledTimes(1);

        // New frames are a new question
        sourceDataNode.setState({
          data: { ...sourceDataNode.state.data!, series: [toDataFrame([[100, 4]])] },
        });

        expect(supplierSpy).toHaveBeenCalledTimes(2);
      });

      it('resolves against the source frames, sharing the pipeline memo, when called with no arguments', () => {
        const supplierSpy = jest.fn().mockReturnValue({ append: [transformer2config] });
        // User transformation doubles, so pipeline output and source frames are distinguishable
        const { transformationNode, activate } = buildSupplierScene();

        transformationNode.setSystemTransformations({ supplier: supplierSpy });
        activate();

        expect(transformationNode.getResolvedSystemTransformations()).toEqual({
          prepend: [],
          append: [{ ...transformer2config, origin: 'plugin', position: 'append' }],
        });

        // One resolution total: the default argument is the frames the pipeline already resolved against,
        // not this object's own transformed output
        expect(supplierSpy).toHaveBeenCalledTimes(1);
        expect(supplierSpy.mock.calls[0][0].series[0].fields[1].values).toEqual([1, 2, 3]);
      });

      it('resolves against empty frames when the source has no data yet', () => {
        // A query runner has no data in state until it has run, which is the load time case an editor
        // reading the resolution would hit
        const transformationNode = new SceneDataTransformer({
          transformations: [],
          $data: new SceneQueryRunner({ queries: [{ refId: 'A' }] }),
        });

        const supplierSpy = jest.fn().mockReturnValue({});
        transformationNode.setSystemTransformations({ supplier: supplierSpy });

        expect(transformationNode.getResolvedSystemTransformations()).toEqual({ prepend: [], append: [] });
        expect(supplierSpy).toHaveBeenCalledWith({ series: [] });

        // Repeated reads must still hit the memo, which they cannot if the empty default allocates a fresh
        // array on every call
        transformationNode.getResolvedSystemTransformations();
        expect(supplierSpy).toHaveBeenCalledTimes(1);
      });

      it('merges supplied transformations with the concrete ones for the same origin', () => {
        const { transformationNode, consumer, activate } = buildSupplierScene();

        transformationNode.setSystemTransformations({
          // +4
          prepend: [annotationTransformerConfigNoTopic],
          // *3
          supplier: () => ({ append: [transformer2config] }),
        });

        activate();

        const series = sourceDataNode.state.data!.series;
        expect(transformationNode.getResolvedSystemTransformations(series)).toEqual({
          prepend: [{ ...annotationTransformerConfigNoTopic, origin: 'plugin', position: 'prepend' }],
          append: [{ ...transformer2config, origin: 'plugin', position: 'append' }],
        });

        // (value + 4) * 2 * 3
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([30, 36, 42]);
      });

      it('composes suppliers from several origins in registration order', () => {
        const { transformationNode, consumer, activate } = buildSupplierScene([]);

        transformationNode.setSystemTransformations({
          origin: 'first',
          supplier: () => ({ prepend: [transformer2config] }),
        });
        transformationNode.setSystemTransformations({
          origin: 'second',
          supplier: () => ({ prepend: [annotationTransformerConfigNoTopic] }),
        });

        activate();

        const series = sourceDataNode.state.data!.series;
        expect(transformationNode.getResolvedSystemTransformations(series).prepend).toEqual([
          { ...transformer2config, origin: 'first', position: 'prepend' },
          { ...annotationTransformerConfigNoTopic, origin: 'second', position: 'prepend' },
        ]);

        // value * 3 + 4
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([7, 10, 13]);
      });

      it('honours the topic of supplied transformations', () => {
        const { transformationNode, consumer, activate } = buildSupplierScene();

        // +4, annotations only
        transformationNode.setSystemTransformations({ supplier: () => ({ append: [annotationTransformerConfig] }) });
        activate();

        const data = sceneGraph.getData(consumer).state.data;

        // value * 2 from the user transformation, untouched by the annotations only entry
        expect(data?.series[0].fields[1].values).toEqual([2, 4, 6]);
        expect(data?.annotations?.[0].fields[1].values).toEqual([5, 6, 7]);
      });

      it('tags a bare custom transform operator with the series topic', () => {
        const { transformationNode, consumer, activate } = buildSupplierScene();

        transformationNode.setSystemTransformations({ supplier: () => ({ append: [customTransformOperator] }) });
        activate();

        const series = sourceDataNode.state.data!.series;
        expect(transformationNode.getResolvedSystemTransformations(series).append).toEqual([
          { operator: customTransformOperator, topic: DataTopic.Series, origin: 'plugin', position: 'append' },
        ]);

        // value * 2 / 100
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);
      });

      it('keeps the passthrough fast path when every supplier resolves to nothing', () => {
        const { transformationNode, activate } = buildSupplierScene([]);

        transformationNode.setSystemTransformations({ supplier: () => ({}) });
        activate();

        // Passthrough hands the source data straight on rather than rebuilding it
        expect(transformationNode.state.data).toBe(sourceDataNode.state.data);
      });

      it('re-runs the pipeline when the supplier is registered or removed', () => {
        const { transformationNode, consumer, activate } = buildSupplierScene();

        activate();

        // value * 2
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([2, 4, 6]);

        // Nothing about the supplier reaches state, so registering it has to force the re-run itself
        transformationNode.setSystemTransformations({ supplier: () => ({ append: [transformer2config] }) });
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([6, 12, 18]);

        transformationNode.setSystemTransformations({});
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([2, 4, 6]);
      });

      it('does not re-emit when a newly registered supplier resolves to nothing', () => {
        const { transformationNode, activate } = buildSupplierScene([]);

        const emissions: PanelData[] = [];
        transformationNode.getResultsStream().subscribe((result) => emissions.push(result.data));

        activate();

        expect(emissions).toHaveLength(1);

        // What most panels look like: the plugin contributes no transformations, so registering its
        // supplier changes nothing and must not cost a pass
        transformationNode.setSystemTransformations({ supplier: () => ({}) });

        expect(emissions).toHaveLength(1);
      });

      it('does not re-run when a swapped supplier resolves to the same thing', () => {
        const { transformationNode, activate } = buildSupplierScene([]);

        const emissions: PanelData[] = [];
        transformationNode.getResultsStream().subscribe((result) => emissions.push(result.data));

        transformationNode.setSystemTransformations({ supplier: () => ({ append: [transformer2config] }) });
        activate();

        // value * 3
        expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([3, 6, 9]);
        expect(emissions).toHaveLength(1);

        // A fresh closure resolving to the same config, which is what a registrar rebuilding its supplier
        // on every activation looks like
        transformationNode.setSystemTransformations({ supplier: () => ({ append: [transformer2config] }) });

        expect(emissions).toHaveLength(1);
      });

      it('does not re-run when a swapped supplier spells the same operator differently', () => {
        const { transformationNode, activate } = buildSupplierScene([]);

        const emissions: PanelData[] = [];
        transformationNode.getResultsStream().subscribe((result) => emissions.push(result.data));

        transformationNode.setSystemTransformations({ supplier: () => ({ append: [customTransformOperator] }) });
        activate();

        expect(emissions).toHaveLength(1);

        // Bare and object form are one entry once the pipeline normalizes them, so this is not a change
        transformationNode.setSystemTransformations({
          supplier: () => ({ append: [{ operator: customTransformOperator, topic: DataTopic.Series }] }),
        });

        expect(emissions).toHaveLength(1);
      });

      it('re-runs when a swapped supplier resolves to something else', () => {
        const { transformationNode, activate } = buildSupplierScene([]);

        transformationNode.setSystemTransformations({ supplier: () => ({ append: [transformer2config] }) });
        activate();

        // value * 3
        expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([3, 6, 9]);

        transformationNode.setSystemTransformations({
          supplier: () => ({ append: [annotationTransformerConfigNoTopic] }),
        });

        // value + 4
        expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([5, 6, 7]);
      });

      it('picks up a supplier that resolves differently on reprocessTransformations', () => {
        const { transformationNode, consumer, activate } = buildSupplierScene();
        let ready = false;

        transformationNode.setSystemTransformations({
          supplier: () => (ready ? { append: [transformer2config] } : {}),
        });

        activate();

        // value * 2 - the supplier had nothing to give yet
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([2, 4, 6]);

        ready = true;
        transformationNode.reprocessTransformations();

        // value * 2 * 3, same frames but a new resolution
        expect(sceneGraph.getData(consumer).state.data?.series[0].fields[1].values).toEqual([6, 12, 18]);
      });

      it('carries suppliers into a clone so the clone never emits untransformed data', () => {
        const { transformationNode, activate, attach } = buildSupplierScene([]);

        transformationNode.setSystemTransformations({ supplier: () => ({ append: [transformer2config] }) });
        activate();

        // value * 3
        expect(transformationNode.state.data?.series[0].fields[1].values).toEqual([3, 6, 9]);

        const clone = transformationNode.clone();
        attach(clone);

        const emissions: unknown[] = [];
        clone.getResultsStream().subscribe((result) => emissions.push(result.data.series[0].fields[1].values));

        clone.activate();

        expect(clone.getResolvedSystemTransformations(sourceDataNode.state.data!.series).append).toEqual([
          { ...transformer2config, origin: 'plugin', position: 'append' },
        ]);

        // The clone was cloned with transformed data; activating it must not replace that with the source
        expect(clone.state.data?.series[0].fields[1].values).toEqual([3, 6, 9]);
        expect(emissions).not.toContainEqual([1, 2, 3]);
      });

      it('keeps resolving the carried supplier when the clone gets new data', () => {
        const { transformationNode, activate, attach } = buildSupplierScene([]);

        transformationNode.setSystemTransformations({ supplier: () => ({ append: [transformer2config] }) });
        activate();

        const clone = transformationNode.clone();
        attach(clone);

        clone.activate();

        sourceDataNode.setState({
          data: { ...sourceDataNode.state.data!, series: [toDataFrame([[100, 5]])] },
        });

        // value * 3 on the new frames, so the carried supplier is live rather than just present
        expect(clone.state.data?.series[0].fields[1].values).toEqual([15]);
      });

      it('carries the origin order into a clone', () => {
        const { transformationNode, activate } = buildSupplierScene([]);

        transformationNode.setSystemTransformations({
          origin: 'first',
          supplier: () => ({ prepend: [transformer2config] }),
        });
        transformationNode.setSystemTransformations({
          origin: 'second',
          supplier: () => ({ prepend: [annotationTransformerConfigNoTopic] }),
        });

        activate();

        const clone = transformationNode.clone();

        expect(clone.getResolvedSystemTransformations(sourceDataNode.state.data!.series).prepend).toEqual([
          { ...transformer2config, origin: 'first', position: 'prepend' },
          { ...annotationTransformerConfigNoTopic, origin: 'second', position: 'prepend' },
        ]);
      });

      it('degrades a throwing supplier to a no-op instead of erroring the stream', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { transformationNode, consumer, activate } = buildSupplierScene();

        transformationNode.setSystemTransformations({
          supplier: () => {
            throw new Error('no frames to my liking');
          },
        });

        activate();

        const data = sceneGraph.getData(consumer).state.data;

        // value * 2 - the user transformation still runs
        expect(data?.series[0].fields[1].values).toEqual([2, 4, 6]);
        expect(data?.state).not.toEqual(LoadingState.Error);
        expect(data?.errors).toBeUndefined();
        expect(errorSpy).toHaveBeenCalled();

        errorSpy.mockRestore();
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
