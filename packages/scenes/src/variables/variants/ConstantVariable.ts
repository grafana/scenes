import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, VariableValue } from '../types';

export interface ConstantVariableState extends SceneVariableState {
  value: VariableValue;
}

export class ConstantVariable
  extends SceneObjectBase<ConstantVariableState>
  implements SceneVariable<ConstantVariableState>
{
  public constructor(initialState: Partial<ConstantVariableState>) {
    super({
      type: 'constant',
      value: '',
      name: '',
      ...initialState,
      skipUrlSync: true,
    });
  }

  public getValue(): VariableValue {
    return this.state.value;
  }
}
