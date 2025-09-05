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
  isJson: boolean;
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
      isJson: false,
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const interpolated = sceneGraph.interpolate(this, this.state.query);

    let options: VariableValueOption[] = [];

    if (this.state.isJson) {
      try {
        const parsedOptions = JSON.parse(interpolated);

        if (!Array.isArray(parsedOptions)) {
          throw new Error('Query must be a JSON array');
        }

        if (typeof parsedOptions[0] === 'string') {
          options = parsedOptions.map((value) => ({ label: value.trim(), value: value.trim() }));
        } else if (typeof parsedOptions[0] === 'object' && parsedOptions[0] !== null) {
          const { valueProp, textProp } = this.state;

          if (!valueProp) {
            throw new Error('valueProp must be set');
          }

          options = (parsedOptions as Array<Record<string, any>>).map((o) => ({
            label: o[valueProp]?.trim(),
            value: o[textProp as any]?.trim(),
            properties: o,
          }));
        } else {
          throw new Error('Query must be a JSON array of strings or objects');
        }
      } catch (error) {
        throw error;
      }
    } else {
      const match = interpolated.match(/(?:\\,|[^,])+/g) ?? [];

      options = match.map((text) => {
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

    if (!options.length) {
      this.skipNextValidation = true;
    }

    return of(options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}
