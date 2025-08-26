import { map, Observable, of } from 'rxjs';

import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../MultiValueVariable';
import { VariableValue, VariableValueOption } from '../../types';
import { ObjectVariable } from '../ObjectVariable';

export interface MultiObjectOptionsProvider {
  getOptions(): Observable<MultiObjectVariableOption[]>;
}

export interface MultiObjectVariableOption {
  value: string;
  label: string;
  obj: Record<string, unknown>;
}

interface MultiObjectVariableState extends MultiValueVariableState {
  provider: MultiObjectOptionsProvider;
  options: MultiObjectVariableOption[];
}

export class MultiObjectVariable extends MultiValueVariable<MultiObjectVariableState> {
  public constructor(
    initialState: Partial<MultiObjectVariableState> & Required<Pick<MultiObjectVariableState, 'provider'>>
  ) {
    super({
      // @ts-ignore
      type: 'mutli-object',
      query: '',
      value: '',
      text: '',
      options: [],
      name: '',
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    return this.state.provider.getOptions();
  }

  public getValue(fieldPath?: string): VariableValue {
    const currentValue = this.state.value;
    if (!fieldPath) {
      return currentValue;
    }

    const currentOption = this.state.options.find((option) => option.value === this.state.value);
    if (!currentOption) {
      return currentValue;
    }

    return new ObjectVariable({
      type: 'custom',
      name: '',
      value: currentOption.obj,
    }).getValue(fieldPath);
  }
}
