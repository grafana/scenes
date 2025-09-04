import { Observable } from 'rxjs';

import { SceneComponentProps } from '../../../core/types';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../MultiValueVariable';
import { MultiOrSingleValueSelect } from '../../components/VariableValueSelect';
import { VariableValue, VariableValueOption } from '../../types';
import { ObjectVariable } from '../ObjectVariable';
import React from 'react';

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
    const value = this.state.value;
    if (!fieldPath) {
      return value;
    }

    const values = this.state.isMulti ? (this.state.value as VariableValue[]) : [this.state.value];
    const currentOptions = this.state.options.filter((o) => values.includes(o.value));

    if (!currentOptions.length) {
      return value;
    }

    if (this.state.isMulti) {
      return currentOptions.map((o) =>
        new ObjectVariable({
          type: 'custom',
          name: '',
          value: o.obj,
        }).getValue(fieldPath)
      ) as VariableValue;
    }

    return new ObjectVariable({
      type: 'custom',
      name: '',
      value: currentOptions[0].obj,
    }).getValue(fieldPath);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
