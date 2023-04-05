import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';

/**
 * Used in a couple of unit tests
 */
export interface TestSceneState extends SceneObjectState {
  nested?: TestScene;
}

export class TestScene extends SceneObjectBase<TestSceneState> {}
