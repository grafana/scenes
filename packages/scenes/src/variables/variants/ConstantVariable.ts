import { Observable, of } from 'rxjs';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import {
  SceneVariable,
  SceneVariableState,
  SceneVariableValueChangedEvent,
  ValidateAndUpdateResult,
  VariableValue,
} from '../types';

export interface ConstantVariableState extends SceneVariableState {
  value: VariableValue;
}

export class ConstantVariable
  extends SceneObjectBase<ConstantVariableState>
  implements SceneVariable<ConstantVariableState>
{
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['value'],
  });

  private _prevValue: VariableValue = '';

  public constructor(initialState: Partial<ConstantVariableState>) {
    super({
      type: 'constant',
      value: '',
      name: '',
      ...initialState,
      skipUrlSync: true,
    });
  }

  /**
   * This function is called on when SceneVariableSet is activated or when a dependency changes.
   */
  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    const newValue = this.getValue();

    if (this._prevValue !== newValue) {
      this._prevValue = newValue;
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }

    return of({});
  }

  public getValue(): VariableValue {
    if (typeof this.state.value === 'string') {
      return sceneGraph.interpolate(this, this.state.value);
    }

    return this.state.value;
  }
}
