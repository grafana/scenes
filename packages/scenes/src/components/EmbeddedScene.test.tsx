import { EmbeddedScene } from './EmbeddedScene';
import { SceneFlexLayout } from './layout/SceneFlexLayout';
import { SceneCanvasText } from './SceneCanvasText';
import { SceneTimePicker } from './SceneTimePicker';

describe('Scene', () => {
  it('Simple scene', () => {
    const scene = new EmbeddedScene({
      controls: [new SceneTimePicker({})],
      body: new SceneFlexLayout({
        children: [],
      }),
    });

    // TODO make this a proper render rest
    expect(scene.state.body).toBeDefined();
  });

  describe('When activated', () => {
    test('Should set global window.__grafanaSceneContext object', () => {
      const scene = new EmbeddedScene({
        body: new SceneCanvasText({ text: 'Hello World' }),
      });

      const deactivate = scene.activate();

      expect((window as any).__grafanaSceneContext).toBe(scene);

      deactivate();
      expect((window as any).__grafanaSceneContext).toBeUndefined();
    });
  });
});
