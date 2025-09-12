import { Observable } from 'rxjs';

import { SceneComponentProps } from '../../core/types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../components/VariableValueSelect';
import { VariableValueOption } from '../types';

import React from 'react';
import { sceneGraph } from '../../core/sceneGraph';
import { CustomOptionsProviderBuilder, CustomOptionsProviderType } from './CustomOptionsProviders';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';

export interface CustomVariableState extends MultiValueVariableState {
  query: string;
  optionsProvider: CustomOptionsProviderType;
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
      optionsProvider: CustomOptionsProviderType.CSV,
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const interpolated = sceneGraph.interpolate(this, this.state.query);

    let optionsProvider;

    if (this.state.optionsProvider === 'JSON') {
      optionsProvider = CustomOptionsProviderBuilder.fromJson({
        json: interpolated,
        valueProp: this.state.valueProp,
        textProp: this.state.textProp,
      });
    } else {
      optionsProvider = CustomOptionsProviderBuilder.fromCsv({ csv: interpolated });
    }

    return new Observable((subscriber) => {
      optionsProvider.getOptions().subscribe({
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
