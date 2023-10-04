import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneCanvasText } from '../../components/SceneCanvasText';

describe('setWindowGrafanaScene', () => {
  test('Should set global window.__grafanaSceneContext object', () => {
    const scene = new EmbeddedScene({
      body: new SceneCanvasText({ text: 'Hello World' }),
    });

    const deactivate = scene.activate();

    expect((window as any).__grafanaSceneContext).toBe(scene);

    deactivate();
    expect((window as any).__grafanaSceneContext).toBeUndefined();
  });

  test('Should restore global window.__grafanaSceneContext to previous on deactivate', () => {
    const scene1 = new EmbeddedScene({
      body: new SceneCanvasText({ text: 'Hello World' }),
    });

    const scene2 = new EmbeddedScene({
      body: new SceneCanvasText({ text: 'Hello World' }),
    });

    const deactivateScene1 = scene1.activate();
    const deactivateScene2 = scene2.activate();

    expect((window as any).__grafanaSceneContext).toBe(scene2);

    deactivateScene2();
    expect((window as any).__grafanaSceneContext).toBe(scene1);

    deactivateScene1();
    expect((window as any).__grafanaSceneContext).toBeUndefined();
  });
});
