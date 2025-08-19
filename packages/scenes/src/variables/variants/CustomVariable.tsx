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

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const interpolated = sceneGraph.interpolate(this, this.state.query);
    const match = interpolated.match(/(?:\\,|[^,])+/g) ?? [];

    const options = match.map((text) => {
      text = text.replace(/\\,/g, ',');
      const textMatch = /^\s*(.+)\s:\s(.+)$/g.exec(text) ?? [];
      if (textMatch.length === 3) {
        const [, key, value] = textMatch;
        return { label: key.trim(), value: value.trim() };
      } else {
        return { label: text.trim(), value: text.trim() };
      }
    });

    if (!options.length) {
      this.skipNextValidation = true;
    }

    return of(options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
