import { SceneVariableState } from '../types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { AdHocVariableFilter } from '@grafana/data';

export interface AdHocVariableState extends SceneVariableState {
  filters: AdHocVariableFilter[];
}

export class AdHocVariable extends SceneObjectBase<AdHocVariableState> {
  public constructor(initialState: Partial<AdHocVariableState>) {
    super({
      type: 'adhoc',
      name: '',
      filters: [],
      ...initialState,
    });
  }

  public getValue() {
    return 'NA';
  }
}
