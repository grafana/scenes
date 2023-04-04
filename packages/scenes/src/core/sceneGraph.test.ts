import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../components/SceneCanvasText';
import { SceneTimePicker } from '../components/SceneTimePicker';
import { sceneGraph } from './sceneGraph';

describe('sceneGraph', () => {
  it('Can find object', () => {
    const item1 = new SceneFlexItem({ key: 'A', body: new SceneCanvasText({ text: 'A' }) });
    const item2 = new SceneFlexItem({ key: 'B', body: new SceneCanvasText({ text: 'B' }) });

    const scene = new EmbeddedScene({
      controls: [new SceneTimePicker({})],
      body: new SceneFlexLayout({
        children: [item1, item2],
      }),
    });

    // from root
    expect(sceneGraph.findObject(scene, (s) => s.state.key === 'A')).toBe(item1);
    // from sibling
    expect(sceneGraph.findObject(item2, (s) => s.state.key === 'A')).toBe(item1);
  });
});
