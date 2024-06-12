import { SceneObjectBase } from '@grafana/scenes';
import { SceneContextObject } from './SceneContextObject';

class CustomSceneObject extends SceneObjectBase {}

describe('SceneContextObject', () => {
  it('can add object to scene', () => {
    const scene = new SceneContextObject({});
    const obj = new CustomSceneObject({});

    const cleanUpFn = scene.addToScene(obj);

    expect(scene.state.children[0]).toBe(obj);
    expect(obj.parent).toBe(scene);

    cleanUpFn();

    expect(scene.state.children.length).toBe(0);
  });
});
