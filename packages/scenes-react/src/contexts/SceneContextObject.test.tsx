import { SceneObjectBase } from '@grafana/scenes';
import { SceneContextObject } from './SceneContextObject';

class CustomSceneObject extends SceneObjectBase {}

describe('SceneContextObject', () => {
  it('can add object to scene', () => {
    const scene = new SceneContextObject({});
    const obj = new CustomSceneObject({});

    scene.addToScene(obj);

    expect(scene.state.children[0]).toBe(obj);
    expect(obj.parent).toBe(scene);
  });
});
