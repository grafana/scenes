import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, VariableValue } from '../types';
import { AdHocFilterSet } from './AdHocFiltersSet';

export interface AdHocFiltersVariableState extends SceneVariableState {
  set: AdHocFilterSet;
}

export class AdHocFiltersVariable
  extends SceneObjectBase<AdHocFiltersVariableState>
  implements SceneVariable<AdHocFiltersVariableState>
{
  public getValue(fieldPath?: string | undefined): VariableValue | null | undefined {
    throw new Error('Method not implemented.');
  }
}
