import { Observable, of } from 'rxjs';

import { SceneComponentProps } from '../../core/types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../components/VariableValueSelect';
import { csvToJson } from '../utils';
import { VariableValueOption } from '../types';

import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';
import { sceneGraph } from '../../core/sceneGraph';
import React from 'react';
import { omit } from 'lodash';

type ValuesFormat = 'list' | 'csv' | 'json';

export interface CustomVariableState extends MultiValueVariableState {
  query: string;
  valuesFormat?: ValuesFormat;
}

export class CustomVariable extends MultiValueVariable<CustomVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['query'],
  });

  public constructor(initialState: Partial<CustomVariableState>) {
    super({
      type: 'custom',
      query: '',
      valuesFormat: 'list',
      value: '',
      text: '',
      options: [],
      name: '',
      ...initialState,
    });
  }

  public convertObjectToVariableValueOptions(parsedOptions: any) {
    if (!Array.isArray(parsedOptions) || parsedOptions.some((o) => typeof o !== 'object' || o === null)) {
      throw new Error('Query must be a JSON array of objects');
    }
    const textProp = 'text';
    const valueProp = 'value';
    return parsedOptions.map((o) => ({
      label: String(o[textProp] || o[valueProp])?.trim(),
      value: String(o[valueProp]).trim(),
      properties: omit(o, [textProp, valueProp]),
    }));
  }

  // We expose this publicly as we also need it outside the variable
  // The interpolate flag is needed since we don't always want to get the interpolated options
  public transformListStringToOptions(str: string, interpolate = true): VariableValueOption[] {
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
    return this.convertObjectToVariableValueOptions(parsedOptions);
  }

  public transformCSVToOptions(csvString: string): VariableValueOption[] {
    if (!csvString) {
      return [];
    }
    const parsedOptions = csvToJson(csvString);
    return this.convertObjectToVariableValueOptions(parsedOptions);
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const options =
      this.state.valuesFormat === 'json'
        ? this.transformJsonToOptions(this.state.query)
        : this.state.valuesFormat === 'csv'
        ? this.transformCSVToOptions(this.state.query)
        : this.transformListStringToOptions(this.state.query);

    if (!options.length) {
      this.skipNextValidation = true;
    }

    return of(options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
