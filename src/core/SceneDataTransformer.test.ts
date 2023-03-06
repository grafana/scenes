import { map } from 'rxjs';

import {
  ArrayVector,
  getDefaultTimeRange,
  LoadingState,
  standardTransformersRegistry,
  toDataFrame,
} from '@grafana/data';

import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';

import { SceneDataNode } from './SceneDataNode';
import { SceneDataTransformer } from './SceneDataTransformer';
import { SceneObjectBase } from './SceneObjectBase';
import { sceneGraph } from './sceneGraph';
import { CustomTransformOperator } from './types';

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

describe('SceneDataTransformer', () => {
  let transformerSpy1 = jest.fn();
  let transformerSpy2 = jest.fn();
  let customTransformerSpy = jest.fn();

  let sourceDataNode: SceneDataNode;
  let customTransformOperator: CustomTransformOperator;

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
      },
    });

    customTransformOperator = () => (source) => {
      customTransformerSpy();
      return source.pipe(
        map((data) => {
          return data.map((frame) => {
            return {
              ...frame,
              fields: frame.fields.map((field) => {
                return {
                  ...field,
                  values: new ArrayVector(field.values.toArray().map((v) => v / 100)),
                };
              }),
            };
          });
        })
      );
    };

    standardTransformersRegistry.setInit(() => {
      return [
        {
          id: 'transformer1',
          editor: () => null,
          transformation: {
            id: 'transformer1',
            name: 'Custom Transformer',
            operator: (options) => (source) => {
              // console.log('transformer1', options);
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
          id: 'transformer2',
          editor: () => null,
          transformation: {
            id: 'transformer2',
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

  afterEach(() => {
    transformerSpy1.mockClear();
    transformerSpy2.mockClear();
    customTransformerSpy.mockClear();
  });

  it('applies transformations to closest data node', () => {
    const transformationNode = new SceneDataTransformer({
      transformations: [transformer1config, transformer2config],
    });

    const consumer = new TestSceneObject({
      $data: transformationNode,
    });

    // @ts-expect-error
    const scene = new SceneFlexLayout({
      $data: sourceDataNode,
      children: [consumer],
    });

    sourceDataNode.activate();
    transformationNode.activate();

    // Transforms initial data
    let data = sceneGraph.getData(consumer).state.data;
    expect(transformerSpy1).toHaveBeenCalledTimes(1);
    expect(transformerSpy1).toHaveBeenCalledWith({ option: 'value1' });
    expect(transformerSpy2).toHaveBeenCalledTimes(1);
    expect(transformerSpy2).toHaveBeenCalledWith({ option: 'value2' });

    expect(data?.series.length).toBe(1);
    expect(data?.series[0].fields).toHaveLength(2);
    expect(data?.series[0].fields[0].values.toArray()).toEqual([600, 1200, 1800]);
    expect(data?.series[0].fields[1].values.toArray()).toEqual([6, 12, 18]);

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
    expect(transformerSpy1).toHaveBeenCalledTimes(2);
    expect(transformerSpy2).toHaveBeenCalledTimes(2);

    expect(data?.series[0].fields[0].values.toArray()).toEqual([60, 120, 180]);
    expect(data?.series[0].fields[1].values.toArray()).toEqual([60, 120, 180]);
  });

  describe('when custom transform operator is used', () => {
    it('applies single custom transformer', () => {
      const transformationNode = new SceneDataTransformer({
        transformations: [customTransformOperator],
      });

      const consumer = new TestSceneObject({
        $data: transformationNode,
      });

      // @ts-expect-error
      const scene = new SceneFlexLayout({
        $data: sourceDataNode,
        children: [consumer],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      // Transforms initial data
      let data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);

      expect(data?.series.length).toBe(1);
      expect(data?.series[0].fields).toHaveLength(2);
      expect(data?.series[0].fields[0].values.toArray()).toEqual([1, 2, 3]);
      expect(data?.series[0].fields[1].values.toArray()).toEqual([0.01, 0.02, 0.03]);

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

      expect(data?.series[0].fields[0].values.toArray()).toEqual([0.1, 0.2, 0.3]);
      expect(data?.series[0].fields[1].values.toArray()).toEqual([0.1, 0.2, 0.3]);
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
        children: [consumer],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      // Transforms initial data
      let data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);
      expect(transformerSpy1).toHaveBeenCalledTimes(1);

      expect(data?.series.length).toBe(1);
      expect(data?.series[0].fields).toHaveLength(2);
      expect(data?.series[0].fields[0].values.toArray()).toEqual([2, 4, 6]);
      expect(data?.series[0].fields[1].values.toArray()).toEqual([0.02, 0.04, 0.06]);

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
      expect(transformerSpy1).toHaveBeenCalledTimes(2);

      expect(data?.series[0].fields[0].values.toArray()).toEqual([0.2, 0.4, 0.6]);
      expect(data?.series[0].fields[1].values.toArray()).toEqual([0.2, 0.4, 0.6]);
    });

    it.skip('applies  trailing custom transformer', () => {
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
        children: [consumer],
      });

      sourceDataNode.activate();
      transformationNode.activate();

      // Transforms initial data
      let data = sceneGraph.getData(consumer).state.data;
      expect(customTransformerSpy).toHaveBeenCalledTimes(1);
      expect(transformerSpy1).toHaveBeenCalledTimes(1);

      expect(data?.series.length).toBe(1);
      expect(data?.series[0].fields).toHaveLength(2);
      expect(data?.series[0].fields[0].values.toArray()).toEqual([2, 4, 6]);
      expect(data?.series[0].fields[1].values.toArray()).toEqual([0.02, 0.04, 0.06]);

      // sourceDataNode.setState({
      //   data: {
      //     state: LoadingState.Done,
      //     timeRange: getDefaultTimeRange(),
      //     series: [
      //       toDataFrame([
      //         [10, 10],
      //         [20, 20],
      //         [30, 30],
      //       ]),
      //     ],
      //   },
      // });

      // // Transforms updated data
      // data = sceneGraph.getData(consumer).state.data;
      // expect(customTransformerSpy).toHaveBeenCalledTimes(2);
      // expect(transformerSpy1).toHaveBeenCalledTimes(2);

      // expect(data?.series[0].fields[0].values.toArray()).toEqual([0.2, 0.4, 0.6]);
      // expect(data?.series[0].fields[1].values.toArray()).toEqual([0.2, 0.4, 0.6]);
    });
    it('applies mixed transforms', () => {});
  });
});
