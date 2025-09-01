import { render } from '@testing-library/react';
import React from 'react';
import { of } from 'rxjs';

import { sceneGraph } from '.';
import { getDashboardControls, getVariables, hasVariableDependencyInLoadingState } from './sceneGraph';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneTimePicker } from '../../components/SceneTimePicker';
import { TestAnnotationsDataLayer } from '../../querying/layers/TestDataLayer';
import { SceneDataLayerSet } from '../../querying/SceneDataLayerSet';
import { activateFullSceneTree } from '../../utils/test/activateFullSceneTree';
import { SceneVariableSet } from '../../variables/sets/SceneVariableSet';
import { SceneVariable } from '../../variables/types';
import { QueryVariable } from '../../variables/variants/query/QueryVariable';
import { TestVariable } from '../../variables/variants/TestVariable';
import { SceneDataNode } from '../SceneDataNode';
import { SceneObject, SceneObjectState } from '../types';
import { SceneObjectBase } from '../SceneObjectBase';

describe('sceneGraph', () => {
  it('Can find object', () => {
    const data = new SceneDataNode();
    const item1 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A' }), $data: data });
    const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });
    const timePicker = new SceneTimePicker({ key: 'time-picker' });

    const scene = new EmbeddedScene({
      controls: [timePicker],
      body: new SceneFlexLayout({
        children: [item1, item2],
      }),
    });

    // from root
    expect(sceneGraph.findObject(scene, (s) => s.state.key === 'A')).toBe(item1);
    // from sibling
    expect(sceneGraph.findObject(item2, (s) => s.state.key === 'A')).toBe(item1);
    // from data
    expect(sceneGraph.findObject(data, (s) => s.state.key === 'A')).toBe(item1);
    // from item deep in graph finding control
    expect(sceneGraph.findObject(item2, (s) => s.state.key === 'time-picker')).toBe(timePicker);
  });

  it('Returns first match', () => {
    const item1 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A' }) });
    const item2 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A2' }) });

    const scene = new EmbeddedScene({
      body: new SceneFlexLayout({
        children: [item1, item2],
      }),
    });

    // from root
    expect(sceneGraph.findObject(scene, (s) => s.state.key === 'A')).toBe(item1);
  });

  it('Can find all objects given a predicate', () => {
    const data = new SceneDataNode();
    const item1 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A' }), $data: data });
    const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });
    const timePicker = new SceneTimePicker({ key: 'time-picker' });

    const scene = new EmbeddedScene({
      controls: [timePicker],
      body: new SceneFlexLayout({
        children: [item1, item2],
      }),
    });

    const predicate = (o: SceneObject) => o instanceof SceneFlexItem;

    expect(sceneGraph.findAllObjects(scene, predicate)).toEqual([item1, item2]);
  });

  describe('getDataLayers', () => {
    it('resolves data layers from scene object', () => {
      const item1 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A' }) });
      const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });

      const scene = new EmbeddedScene({
        $data: new SceneDataLayerSet({
          layers: [new TestAnnotationsDataLayer({ name: 'Layer 1' })],
        }),
        body: new SceneFlexLayout({
          children: [item1, item2],
        }),
      });

      render(<scene.Component model={scene} />);

      const result = sceneGraph.getDataLayers(item1);

      expect(result).toHaveLength(1);
    });

    it('resolves data layers attached to multiple scene objects from scene object', () => {
      const item1 = new SceneFlexItem({
        key: 'A',
        body: new SceneCanvasText({ text: 'A' }),
      });
      const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });

      const scene = new EmbeddedScene({
        $data: new SceneDataLayerSet({
          layers: [new TestAnnotationsDataLayer({ name: 'Layer 1' })],
        }),
        body: new SceneFlexLayout({
          $data: new SceneDataLayerSet({
            layers: [new TestAnnotationsDataLayer({ name: 'Layer 2' })],
          }),
          children: [item1, item2],
        }),
      });

      render(<scene.Component model={scene} />);

      const result = sceneGraph.getDataLayers(item1);

      expect(result).toHaveLength(2);
    });

    it('resolves data layers attached a scene data', () => {
      const item1 = new SceneFlexItem({
        key: 'A',
        body: new SceneCanvasText({ text: 'A' }),
      });
      const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });

      const scene = new EmbeddedScene({
        $data: new SceneDataLayerSet({
          layers: [new TestAnnotationsDataLayer({ name: 'Layer 1' })],
        }),
        body: new SceneFlexLayout({
          $data: new SceneDataNode({
            $data: new SceneDataLayerSet({
              layers: [new TestAnnotationsDataLayer({ name: 'Layer 2' })],
            }),
          }),
          children: [item1, item2],
        }),
      });

      render(<scene.Component model={scene} />);

      const result = sceneGraph.getDataLayers(item1);

      expect(result).toHaveLength(2);
    });

    describe('resolving the closest data layers', () => {
      it('when in a hierarchy', () => {
        const item1 = new SceneFlexItem({
          key: 'A',
          body: new SceneCanvasText({ text: 'A' }),
        });
        const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });

        const scene = new EmbeddedScene({
          $data: new SceneDataLayerSet({
            name: 'set1',
            layers: [new TestAnnotationsDataLayer({ name: 'Layer 1' })],
          }),
          body: new SceneFlexLayout({
            $data: new SceneDataLayerSet({
              name: 'set2',
              layers: [new TestAnnotationsDataLayer({ name: 'Layer 2' })],
            }),
            children: [item1, item2],
          }),
        });

        render(<scene.Component model={scene} />);

        const result = sceneGraph.getDataLayers(item1, true);

        expect(result).toHaveLength(1);
        expect(result[0].state.name).toBe('set2');
      });

      it('when attached to a data provider', () => {
        const item1 = new SceneFlexItem({
          key: 'A',
          body: new SceneCanvasText({ text: 'A' }),
        });
        const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });

        const scene = new EmbeddedScene({
          $data: new SceneDataLayerSet({
            name: 'set1',
            layers: [new TestAnnotationsDataLayer({ name: 'Layer 1' })],
          }),
          body: new SceneFlexLayout({
            $data: new SceneDataNode({
              $data: new SceneDataLayerSet({
                name: 'set2',
                layers: [new TestAnnotationsDataLayer({ name: 'Layer 2' })],
              }),
            }),
            children: [item1, item2],
          }),
        });

        render(<scene.Component model={scene} />);

        const result = sceneGraph.getDataLayers(item1, true);

        expect(result).toHaveLength(1);
        expect(result[0].state.name).toBe('set2');
      });
    });
  });

  describe('getAncestor', () => {
    it('Can get ancestor', () => {
      const innerObj = new SceneCanvasText({ text: 'hello' });
      const scene = new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            body: innerObj,
          }),
        ],
      });

      expect(sceneGraph.getAncestor(innerObj, SceneFlexLayout)).toBe(scene);
      expect(sceneGraph.getAncestor(innerObj, SceneFlexItem)).toBe(scene.state.children![0]);
      expect(() => {
        sceneGraph.getAncestor(innerObj, EmbeddedScene);
      }).toThrow();
    });
  });

  describe('findDescendents', () => {
    class TestSceneObj extends SceneObjectBase<SceneObjectState & { children?: SceneObject[] }> {}
    class TargetSceneObj extends TestSceneObj {}

    const root = new TestSceneObj({
      children: [
        new TargetSceneObj({ key: '1-target' }),
        new TargetSceneObj({
          key: '2-target',
          children: [new TargetSceneObj({ key: '2-1-target' }), new TestSceneObj({ key: '2-2' })],
        }),
        new TestSceneObj({
          key: '3',
          children: [
            new TargetSceneObj({ key: '3-1-target' }),
            new TestSceneObj({ key: '3-2' }),
            new TargetSceneObj({ key: '3-3-target' }),
          ],
        }),
      ],
    });

    it('Can find all descendents', () => {
      const descendents = sceneGraph.findDescendents(root, TargetSceneObj);

      // Only the descendents of the starting point with the target type should be present
      expect(descendents.length).toBe(5);
      expect(descendents.find((s) => s.state.key === '1-target')).toBeDefined();
      expect(descendents.find((s) => s.state.key === '2-target')).toBeDefined();
      expect(descendents.find((s) => s.state.key === '2-1-target')).toBeDefined();
      expect(descendents.find((s) => s.state.key === '3-1-target')).toBeDefined();
      expect(descendents.find((s) => s.state.key === '3-3-target')).toBeDefined();
      // Not targets should not be present
      expect(descendents.find((s) => s.state.key === '2-2')).toBeUndefined();
      expect(descendents.find((s) => s.state.key === '3-2')).toBeUndefined();
      // Starting point scene object should not be present
      expect(descendents.find((s) => s === root)).toBeUndefined();
    });

    it('Will only find descendents', () => {
      const target2 = root.state.children?.[1];

      expect(target2).toBeDefined();

      if (!target2) {
        return;
      }

      expect(target2.state.key).toBe('2-target');

      const descendents = sceneGraph.findDescendents(target2, TargetSceneObj);

      // Only the descendents of the starting point with the target type should be present
      expect(descendents.length).toBe(1);
      expect(descendents.find((s) => s.state.key === '2-1-target')).toBeDefined();
      // Parents and siblings of parents should not be present
      expect(descendents.find((s) => s.state.key === '1-target')).toBeUndefined();
      expect(descendents.find((s) => s.state.key === '2-target')).toBeUndefined();
      // Cousins should not be present
      expect(descendents.find((s) => s.state.key === '3-1-target')).toBeUndefined();
      expect(descendents.find((s) => s.state.key === '3-3-target')).toBeUndefined();
      // Not targets should not be present
      expect(descendents.find((s) => s.state.key === '2-2')).toBeUndefined();
      expect(descendents.find((s) => s.state.key === '3-2')).toBeUndefined();
      // Starting point scene object should not be present
      expect(descendents.find((s) => s === target2)).toBeUndefined();
    });
  });

  describe('can find by key (and type)', () => {
    const data = new SceneDataNode();
    const item1 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A' }), $data: data });
    const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });
    const timePicker = new SceneTimePicker({ key: 'time-picker' });

    const scene = new EmbeddedScene({
      controls: [timePicker],
      body: new SceneFlexLayout({
        children: [item1, item2],
      }),
    });

    // from root
    expect(sceneGraph.findByKey(scene, 'A')).toBe(item1);
    // from sibling
    expect(sceneGraph.findByKey(item2, 'A')).toBe(item1);
    // from data
    expect(sceneGraph.findByKey(data, 'A')).toBe(item1);
    // from item deep in graph finding control
    expect(sceneGraph.findByKey(item2, 'time-picker')).toBe(timePicker);
    // By type
    expect(sceneGraph.findByKeyAndType(scene, 'A', SceneFlexItem)).toBe(item1);
    // By wrong type
    expect(() => sceneGraph.findByKeyAndType(scene, 'A', SceneDataNode)).toThrow();
    // By wrong key
    expect(() => sceneGraph.findByKey(scene, 'NOT A KEY')).toThrow();
    expect(() => sceneGraph.findByKeyAndType(scene, 'NOT A KEY', SceneFlexItem)).toThrow();
  });

  describe('hasVariableDependencyInLoadingState', () => {
    const setupVariables = (variables: SceneVariable[]) => {
      const data = new SceneDataNode();
      const item1 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A' }), $data: data });
      const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });
      const timePicker = new SceneTimePicker({ key: 'time-picker' });
      const scene = new EmbeddedScene({
        $variables: new SceneVariableSet({ variables }),
        controls: [timePicker],
        body: new SceneFlexLayout({
          children: [item1, item2],
        }),
      });

      activateFullSceneTree(scene);

      return scene;
    };

    it('should return false when there are no dependencies', () => {
      const noDependencies = new TestVariable({
        loading: false,
        name: 'resolvedVar',
        query: 'foo',
      });
      const scene = setupVariables([noDependencies]);

      expect(hasVariableDependencyInLoadingState(scene)).toBe(false);
    });

    it('should return false when no variables are in the loading state', () => {
      const resolvedVariable = new TestVariable({
        name: 'resolvedVar',
        query: 'foo',
      });
      const notLoadingDependecies = new TestVariable({
        name: 'notLoadingDependecies',
        query: '$resolvedVar',
      });
      setupVariables([resolvedVariable, notLoadingDependecies]);

      resolvedVariable.signalUpdateCompleted();
      notLoadingDependecies.signalUpdateCompleted();

      expect(hasVariableDependencyInLoadingState(notLoadingDependecies)).toBe(false);
    });

    it('should return true when at least one variable is in the loading state', () => {
      const loadingVariable = new TestVariable({
        name: 'loadingVar',
        query: 'foo',
      });
      const loadingDependecies = new TestVariable({
        name: 'loadingDependecies',
        query: '$loadingVar',
      });

      setupVariables([loadingVariable, loadingDependecies]);

      expect(hasVariableDependencyInLoadingState(loadingDependecies)).toBe(true);
    });

    it('should return false if the variable is a QueryVariable and it is loading because is refering itself', () => {
      const logSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const loadingVariable = new QueryVariable({
        name: 'loadingVar',
        query: '$loadingVar',
      });
      // Mocking the getValueOptions to avoid the actual request
      jest.spyOn(loadingVariable, 'getValueOptions').mockImplementation(() => of([]));

      setupVariables([loadingVariable]);

      expect(hasVariableDependencyInLoadingState(loadingVariable)).toBe(false);
      expect(logSpy).toHaveBeenCalledWith('Query variable is referencing itself');
    });
  });

  describe('getVariables()', () => {
    it('only returns the closest variables that are not meant to be rendered under a dashboard controls menu', () => {
      const variable1 = new TestVariable({ name: 'A', value: '1', showInControlsMenu: false });
      const variable2 = new TestVariable({ name: 'B', value: '1', showInControlsMenu: true });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable1, variable2] }),
        children: [],
      });

      const variables = getVariables(scene);

      expect(variables.state.variables.length).toBe(1);
      expect(variables.state.variables[0].state.name).toBe('A');
    });
  });

  describe('getDashboardControls()', () => {
    it('only returns the closest variables that are not meant to be rendered under a dashboard controls menu', () => {
      const variable1 = new TestVariable({ name: 'A', value: '1', showInControlsMenu: false });
      const variable2 = new TestVariable({ name: 'B', value: '1', showInControlsMenu: true });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable1, variable2] }),
        children: [],
      });

      const variables = getDashboardControls(scene);

      expect(variables.state.variables.length).toBe(1);
      expect(variables.state.variables[0].state.name).toBe('B');
    });
  });
});
