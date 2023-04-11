import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../components/SceneCanvasText';
import { SceneTimePicker } from '../components/SceneTimePicker';
import { SceneDataNode } from './SceneDataNode';
import { sceneGraph } from './sceneGraph';

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
});
