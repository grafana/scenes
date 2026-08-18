import { map, of } from 'rxjs';

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
import { isSystemTransformation, SceneDataTransformer, SceneDataTransformation } from './SceneDataTransformer';
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
        { id: 'annotationTransformer', options: {}, origin: 'system', position: 'prepend' },
        transformer1config,
        { ...transformer2config, origin: 'system', position: 'append' },
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
        { ...transformer2config, origin: 'system', position: 'append' },
      ]);

      // value * 2 * 3
      const data = sceneGraph.getData(consumer).state.data;
      expect(data?.series[0].fields[1].values).toEqual([6, 12, 18]);
    });

    it('keeps transformations from other origins when updating one origin', () => {
      const { transformationNode, consumer } = buildScene();

      // +4 (system), *3 (url)
      transformationNode.setSystemTransformations({ prepend: [{ id: 'annotationTransformer', options: {} }] });
      transformationNode.setSystemTransformations({ append: [transformer2config], origin: 'url' });

      expect(transformationNode.state.transformations).toEqual([
        { id: 'annotationTransformer', options: {}, origin: 'system', position: 'prepend' },
        transformer1config,
        { ...transformer2config, origin: 'url', position: 'append' },
      ]);

      // (value + 4) * 2 * 3
      const data = sceneGraph.getData(consumer).state.data;
      expect(data?.series[0].fields[1].values).toEqual([30, 36, 42]);

      // Clearing system transformations does not touch url ones
      transformationNode.setSystemTransformations({});

      expect(transformationNode.state.transformations).toEqual([
        transformer1config,
        { ...transformer2config, origin: 'url', position: 'append' },
      ]);
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
        { operator, topic: DataTopic.Annotations, origin: 'system', position: 'append', key: 'v1' },
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
        { operator, topic: DataTopic.Series, origin: 'system', position: 'append', key: 'v1' },
      ]);
    });

    it('does not let a key collide across origins', () => {
      const { transformationNode } = buildScene();
      const operator = scaleOperator(10);

      transformationNode.setSystemTransformations({ append: [{ operator, topic: DataTopic.Series, key: 'shared' }] });
      transformationNode.setSystemTransformations({
        prepend: [{ operator, topic: DataTopic.Series, key: 'shared' }],
        origin: 'url',
      });

      expect(transformationNode.state.transformations).toEqual([
        { operator, topic: DataTopic.Series, origin: 'url', position: 'prepend', key: 'shared' },
        transformer1config,
        { operator, topic: DataTopic.Series, origin: 'system', position: 'append', key: 'shared' },
      ]);
    });

    it('wraps bare custom transform operators so they carry the system origin', () => {
      const { transformationNode, consumer } = buildScene();

      transformationNode.setSystemTransformations({ append: [customTransformOperator] });

      expect(transformationNode.state.transformations).toEqual([
        transformer1config,
        { operator: customTransformOperator, topic: DataTopic.Series, origin: 'system', position: 'append' },
      ]);
      expect(transformationNode.state.transformations.filter(isSystemTransformation)).toHaveLength(1);

      // value * 2 / 100
      const data = sceneGraph.getData(consumer).state.data;
      expect(data?.series[0].fields[1].values).toEqual([0.02, 0.04, 0.06]);
    });
    describe('setUserTransformations', () => {
      it('replaces the user transformations while keeping system ones in place', () => {
        const { transformationNode, consumer } = buildScene();

        // +4 (system prepend), *3 (url append)
        transformationNode.setSystemTransformations({ prepend: [{ id: 'annotationTransformer', options: {} }] });
        transformationNode.setSystemTransformations({ append: [transformer2config], origin: 'url' });

        // Swap the user transformation from *2 to *3
        transformationNode.setUserTransformations([transformer2config]);

        expect(transformationNode.state.transformations).toEqual([
          { id: 'annotationTransformer', options: {}, origin: 'system', position: 'prepend' },
          transformer2config,
          { ...transformer2config, origin: 'url', position: 'append' },
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

        // +4 (system prepend), *3 (url append)
        transformationNode.setSystemTransformations({ prepend: [{ id: 'annotationTransformer', options: {} }] });
        transformationNode.setSystemTransformations({ append: [transformer2config], origin: 'url' });

        // Callers migrating off setState({ transformations }) may hand back the whole array
        transformationNode.setUserTransformations(transformationNode.state.transformations);
        transformationNode.setUserTransformations(transformationNode.state.transformations);

        expect(transformationNode.state.transformations).toEqual([
          { id: 'annotationTransformer', options: {}, origin: 'system', position: 'prepend' },
          transformer1config,
          { ...transformer2config, origin: 'url', position: 'append' },
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
          { ...transformer2config, origin: 'system', position: 'append' },
        ]);

        // value * 3, the user *2 is gone
        const data = sceneGraph.getData(consumer).state.data;
        expect(data?.series[0].fields[1].values).toEqual([3, 6, 9]);
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
