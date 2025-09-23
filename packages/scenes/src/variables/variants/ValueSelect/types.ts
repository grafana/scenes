import { Observable } from 'rxjs';
import { SceneVariable, VariableValueOption } from '../../types';
import { VariableGetOptionsArgs } from '../MultiValueVariable';

export interface VariableValueOptionsProvider {
  getValueOptions(variable: SceneVariable, args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
}
