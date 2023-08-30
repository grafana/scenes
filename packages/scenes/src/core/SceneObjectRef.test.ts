import { SceneObjectBase } from './SceneObjectBase';
import { SceneObjectState } from './types';
import { SceneObjectRef } from './SceneObjectRef';

interface TestSceneState extends SceneObjectState {
  name?: string;
  nested?: TestScene;
}

class TestScene extends SceneObjectBase<TestSceneState> {}

interface OtherSceneState extends SceneObjectState {
  sceneRef: SceneObjectRef<TestScene>;
}

class OtherScene extends SceneObjectBase<OtherSceneState> {}

describe('SceneObjectRef', () => {
  it('Can clone with ref pointing to clone', () => {
    const innerScene = new TestScene({ name: 'inner' });
    const outer = new TestScene({ name: 'outer', nested: innerScene });
    const otherScene = new OtherScene({ sceneRef: new SceneObjectRef(innerScene) });
    expect(innerScene.parent).toBe(outer);
    expect(otherScene.state.sceneRef.resolve()).toBe(innerScene);
  });
});
