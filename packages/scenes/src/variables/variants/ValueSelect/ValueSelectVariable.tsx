import { Observable, forkJoin, map, of } from 'rxjs';

import { SceneComponentProps } from '../../../core/types';
import { VariableDependencyConfig } from '../../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../../components/VariableValueSelect';
import { VariableValueOption } from '../../types';

import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../MultiValueVariable';
import React from 'react';

import { VariableValueOptionsProvider } from './types';

export interface ValueSelectVariableState extends MultiValueVariableState {
  providers: VariableValueOptionsProvider[];
}

export class ValueSelectVariable extends MultiValueVariable<ValueSelectVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['providers'],
  });

  public constructor(initialState: Partial<ValueSelectVariableState>) {
    super({
      type: 'custom',
      value: '',
      text: '',
      options: [],
      name: '',
      providers: [],
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    return forkJoin(this.state.providers.map((p) => p.getValueOptions(this, args))).pipe(
      map((all) => {
        const options = all.flat();
        if (!options.length) {
          this.skipNextValidation = true;
        }

        return options;
      })
    );
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
