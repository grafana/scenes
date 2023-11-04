import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState } from '../core/types';
import { VariableDependencyConfig } from './VariableDependencyConfig';

/**
 * Used in a couple of unit tests
 */
export interface TestSceneState extends SceneObjectState {
  nested?: SceneObject;
  /** To test logic for inactive scene objects  */
  hidden?: SceneObject;
}

export class TestScene extends SceneObjectBase<TestSceneState> {}

interface TestSceneObjectState extends SceneObjectState {
  title: string;
  variableValueChanged: number;
}

export class TestObjectWithVariableDependency extends SceneObjectBase<TestSceneObjectState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title'],
    onReferencedVariableValueChanged: () => {
      this.setState({ variableValueChanged: this.state.variableValueChanged + 1 });
    },
  });
}
