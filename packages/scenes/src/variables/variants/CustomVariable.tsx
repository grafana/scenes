import { Observable, of } from 'rxjs';

import { SceneComponentProps } from '../../core/types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../components/VariableValueSelect';
import { VariableValueOption } from '../types';

import React from 'react';
import { sceneGraph } from '../../core/sceneGraph';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';

export interface CustomVariableState extends MultiValueVariableState {
  query: string;
  valuesFormat?: 'csv' | 'json';
}

export class CustomVariable extends MultiValueVariable<CustomVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['query'],
  });

  public constructor(initialState: Partial<CustomVariableState>) {
    super({
      type: 'custom',
      query: '',
      valuesFormat: 'csv',
      value: '',
      text: '',
      options: [],
      name: '',
      ...initialState,
    });
  }

  // We expose this publicly as we also need it outside the variable
  // The interpolate flag is needed since we don't always want to get the interpolated options
  public transformCsvStringToOptions(str: string, interpolate = true): VariableValueOption[] {
    str = interpolate ? sceneGraph.interpolate(this, str) : str;
    const match = str.match(/(?:\\,|[^,])+/g) ?? [];

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

  public transformJsonToOptions(json: string): VariableValueOption[] {
    if (!json) {
      return [];
    }

    const parsedOptions = JSON.parse(json);

    if (!Array.isArray(parsedOptions) || parsedOptions.some((o) => typeof o !== 'object' || o === null)) {
      throw new Error('Query must be a JSON array of objects');
    }

    const textProp = 'text';
    const valueProp = 'value';

    return parsedOptions.map((o) => ({
      label: String(o[textProp] || o[valueProp])?.trim(),
      value: String(o[valueProp]).trim(),
      properties: o,
    }));
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const options =
      this.state.valuesFormat === 'json'
        ? this.transformJsonToOptions(this.state.query)
        : this.transformCsvStringToOptions(this.state.query);

    if (!options.length) {
      this.skipNextValidation = true;
    }

    return of(options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
