import { Observable, of } from 'rxjs';

import { SceneComponentProps } from '../../core/types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../components/VariableValueSelect';
import { VariableValueOption } from '../types';

import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';
import { sceneGraph } from '../../core/sceneGraph';
import React from 'react';

export interface CustomVariableState extends MultiValueVariableState {
  query: string;
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
      ...initialState,
    });
  }

  // We expose this publicly as we also need it outside the variable
  // The interpolate flag is needed since we don't always want to get the interpolated options
  public transformQueryToOptions(interpolate = true): VariableValueOption[] {
    const query = interpolate ? sceneGraph.interpolate(this, this.state.query) : this.state.query;
    const match = query.match(/(?:\\,|[^,])+/g) ?? [];

    return match.map((text) => {
      text = text.replace(/\\,/g, ',');
      const textMatch = /^\s*(.+)\s:\s(.+)$/g.exec(text) ?? [];
      if (textMatch.length === 3) {
        const [, key, value] = textMatch;
        return { label: key.trim(), value: value.trim() };
      } else {
        return { label: text.trim(), value: text.trim() };
      }
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const options = this.transformQueryToOptions();

    if (!options.length) {
      this.skipNextValidation = true;
    }

    return of(options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
