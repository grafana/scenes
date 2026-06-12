import {
  BinaryOperationID,
  DataFrame,
  DataFrameView,
  DataTransformerID,
  FieldType,
  getDefaultTimeRange,
  standardTransformers,
  toDataFrame,
} from '@grafana/data';
import { type DataTransformerConfig, LoadingState } from '@grafana/schema';
import { SceneFlexLayout, SceneFlexItem } from '../../components/layout/SceneFlexLayout';
import { SceneDataNode } from '../../core/SceneDataNode';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObject, SceneDeactivationHandler } from '../../core/types';
import { SceneDataTransformer } from '../../querying/SceneDataTransformer';
import { mockTransformationsRegistry } from '../../utils/mockTransformationsRegistry';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { SceneVariable } from '../types';
import { TestVariable } from '../variants/TestVariable';

const seriesA = toDataFrame({
  fields: [
    { name: 'TheTime', type: FieldType.time, values: [1000, 2000] },
    { name: 'A', type: FieldType.number, values: [1, 100] },
  ],
});

const seriesBC = toDataFrame({
  fields: [
    { name: 'TheTime', type: FieldType.time, values: [1000, 2000] },
    { name: 'B', type: FieldType.number, values: [2, 200] },
    { name: 'C', type: FieldType.number, values: [3, 300] },
    { name: 'D', type: FieldType.string, values: ['first', 'second'] },
    { name: 'E', type: FieldType.boolean, values: [true, false] },
  ],
});

describe('calculateField transformer w/ timeseries', () => {
  beforeAll(() => {
    mockTransformationsRegistry([standardTransformers.calculateFieldTransformer]);
  });

  beforeEach(() => {
    seriesA.fields.forEach((f) => {
      delete f.state;
    });
    seriesBC.fields.forEach((f) => {
      delete f.state;
    });
  });

  it('uses template variable substituion', async () => {
    const cfg = {
      id: DataTransformerID.calculateField,
      options: {
        alias: '$var1',
        mode: 'binary',
        binary: {
          left: 'A',
          operator: BinaryOperationID.Add,
          right: '$var2',
        },
        replaceFields: true,
      },
    };

    const data = await setupTransformationScene(seriesA, cfg, [
      new TestVariable({ name: 'var1', value: 'Test' }),
      new TestVariable({ name: 'var2', value: 5 }),
    ]);

    const filtered = data[0];
    const rows = new DataFrameView(filtered).toArray();
    expect(rows).toEqual([
      {
        Test: 6,
        TheTime: 1000,
      },
      {
        Test: 105,
        TheTime: 2000,
      },
    ]);
  });
});

function activateFullSceneTree(scene: SceneObject): SceneDeactivationHandler {
  const deactivationHandlers: SceneDeactivationHandler[] = [];

  // Important that variables are activated before other children
  if (scene.state.$variables) {
    deactivationHandlers.push(activateFullSceneTree(scene.state.$variables));
  }

  scene.forEachChild((child) => {
    // For query runners which by default use the container width for maxDataPoints calculation we are setting a width.
    // In real life this is done by the React component when VizPanel is rendered.
    if ('setContainerWidth' in child) {
      // @ts-expect-error
      child.setContainerWidth(500);
    }
    deactivationHandlers.push(activateFullSceneTree(child));
  });

  deactivationHandlers.push(scene.activate());

  return () => {
    for (const handler of deactivationHandlers) {
      handler();
    }
  };
}

function setupTransformationScene(
  inputData: DataFrame,
  cfg: DataTransformerConfig,
  variables: SceneVariable[]
): Promise<DataFrame[]> {
  class TestSceneObject extends SceneObjectBase<{}> {}
  const dataNode = new SceneDataNode({
    data: {
      state: LoadingState.Loading,
      timeRange: getDefaultTimeRange(),
      series: [inputData],
    },
  });

  const transformationNode = new SceneDataTransformer({
    transformations: [cfg],
  });

  const consumer = new TestSceneObject({
    $data: transformationNode,
  });

  const scene = new SceneFlexLayout({
    $data: dataNode,
    $variables: new SceneVariableSet({ variables }),
    children: [new SceneFlexItem({ body: consumer })],
  });

  activateFullSceneTree(scene);

  return Promise.resolve(sceneGraph.getData(consumer).state.data?.series ?? []);
}
