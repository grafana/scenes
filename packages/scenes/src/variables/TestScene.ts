import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectStatePlain } from '../core/types';

/**
 * Used in a couple of unit tests
 */
export interface TestSceneState extends SceneObjectStatePlain {
  nested?: TestScene;
}

export class TestScene extends SceneObjectBase<TestSceneState> {}
