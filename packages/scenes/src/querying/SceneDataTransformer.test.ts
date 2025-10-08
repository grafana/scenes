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

      transformer.activate();

      await new Promise((r) => setTimeout(r, 1));

      dataNode.setState({ data: { ...dataNode.state.data, state: LoadingState.Loading } });

      expect(customTransformerSpy).toHaveBeenCalledTimes(1);
      expect(transformer.state.data?.state).toBe(LoadingState.Loading);
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
