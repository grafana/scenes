import { Observable } from 'rxjs';

import { SceneComponentProps } from '../../core/types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../components/VariableValueSelect';
import { VariableValueOption } from '../types';

import React from 'react';
import { buildOptionsProvider, OptionsProviderSettings } from './CustomOptionsProviders';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';

export interface CustomVariableState extends MultiValueVariableState {
  query: string;
  optionsProvider: OptionsProviderSettings;
}

export class CustomVariable extends MultiValueVariable<CustomVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['query'],
  });

  public constructor(initialState: Partial<CustomVariableState>) {
    super({
      type: 'custom',
      query: '',
      value: '',
      text: '',
      options: [],
      name: '',
      optionsProvider: { type: 'csv' },
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    return new Observable((subscriber) => {
      buildOptionsProvider(this as unknown as MultiValueVariable)
        .getOptions()
        .subscribe({
          next: (options) => {
            if (!options.length) {
              this.skipNextValidation = true;
            }
            subscriber.next(options);
          },
          error: (error) => {
            subscriber.error(error);
          },
          complete: () => {
            subscriber.complete();
          },
        });
    });
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
