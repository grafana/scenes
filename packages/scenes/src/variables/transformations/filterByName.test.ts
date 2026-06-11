import {
  DataFrame,
  DataTransformerConfig,
  DataTransformerID,
  FieldType,
  getDefaultTimeRange,
  LoadingState,
  standardTransformers,
  toDataFrame,
} from '@grafana/data';
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

export const seriesWithNamesToMatch = toDataFrame({
  fields: [
    { name: 'startsWithA', type: FieldType.time, values: [1000, 2000] },
    { name: 'B', type: FieldType.boolean, values: [true, false] },
    { name: 'startsWithC', type: FieldType.string, values: ['a', 'b'] },
    { name: 'D', type: FieldType.number, values: [1, 2] },
  ],
});

describe('filterByName transformer', () => {
  beforeAll(() => {
    mockTransformationsRegistry([
      standardTransformers.filterFieldsByNameTransformer,
      standardTransformers.filterFieldsTransformer,
    ]);
  });

  describe('respects', () => {
    it('it can use a variable with multiple comma separated', async () => {
      const cfg = {
        id: DataTransformerID.filterFieldsByName,
        options: {
          include: {
            variable: '$var',
          },
          byVariable: true,
        },
      };

      const data = await setupTransformationScene(seriesWithNamesToMatch, cfg, [
        new TestVariable({ name: 'var', value: 'B,D' }),
      ]);
      const filtered = data[0];
      expect(filtered.fields.length).toBe(2);
      expect(filtered.fields[0].name).toBe('B');
      expect(filtered.fields[1].name).toBe('D');
    });

    it('it can use a variable with multiple comma separated values in {}', async () => {
      const cfg = {
        id: DataTransformerID.filterFieldsByName,
        options: {
          include: {
            variable: '$var',
          },
          byVariable: true,
        },
      };

      const data = await setupTransformationScene(seriesWithNamesToMatch, cfg, [
        new TestVariable({ name: 'var', value: 'B,D' }),
      ]);

      const filtered = data[0];
      expect(filtered.fields.length).toBe(2);
      expect(filtered.fields[0].name).toBe('B');
      expect(filtered.fields[1].name).toBe('D');
    });

    it('uses template variable substitution', async () => {
      const cfg = {
        id: DataTransformerID.filterFieldsByName,
        options: {
          include: {
            pattern: '/^$var/',
          },
        },
      };

      const data = await setupTransformationScene(seriesWithNamesToMatch, cfg, [
        new TestVariable({ name: 'var', value: 'startsWith' }),
      ]);

      const filtered = data[0];
      expect(filtered.fields.length).toBe(2);
      expect(filtered.fields[0].name).toBe('startsWithA');
    });
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
