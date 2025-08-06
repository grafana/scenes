import { t } from '@grafana/i18n';
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
  didSomethingCount: number;
}

export class TestObjectWithVariableDependency extends SceneObjectBase<TestSceneObjectState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title'],
    onVariableUpdateCompleted: () => {
      this.doSomethingThatRequiresVariables();
    },
    onReferencedVariableValueChanged: () => {
      this.setState({ variableValueChanged: this.state.variableValueChanged + 1 });
    },
  });

  public constructor(state: Partial<TestSceneObjectState>) {
    super({
      didSomethingCount: 0,
      variableValueChanged: 0,
      title: t('grafana-scenes.variables.test-object-with-variable-dependency.title.hello', 'Hello'),
      ...state,
    });
  }

  public doSomethingThatRequiresVariables() {
    if (this._variableDependency.hasDependencyInLoadingState()) {
      return;
    }

    this.setState({ didSomethingCount: this.state.didSomethingCount + 1 });
  }
}
