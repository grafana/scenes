import React from 'react';
import { render } from '@testing-library/react';
import { TestAnnotationsDataLayer } from '../../querying/layers/TestDataLayer';
import { SceneDataLayerSet } from '../../querying/SceneDataLayerSet';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneTimePicker } from '../../components/SceneTimePicker';
import { SceneDataNode } from '../SceneDataNode';
import { sceneGraph } from '.';
import { SceneObject } from '../types';

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

  describe('can find by key (and type)', ()=>{
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
    expect(()=>sceneGraph.findByKeyAndType(scene, 'A', SceneDataNode)).toThrow();
    // By wrong key
    expect(()=>sceneGraph.findByKey(scene, 'NOT A KEY')).toThrow();
    expect(()=>sceneGraph.findByKey(scene, 'NOT A KEY', SceneFlexItem)).toThrow();
  })
});
