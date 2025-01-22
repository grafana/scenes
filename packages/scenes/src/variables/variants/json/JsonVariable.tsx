import React from 'react';
import { property } from 'lodash';
import { Observable, map, of } from 'rxjs';
import { Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneComponentProps } from '../../../core/types';
import {
  SceneVariableState,
  SceneVariable,
  ValidateAndUpdateResult,
  VariableValue,
  SceneVariableValueChangedEvent,
} from '../../types';

export interface JsonVariableState extends SceneVariableState {
  /**
   * The current value
   */
  value?: string;
  /**
   * O
   */
  options: JsonVariableOption[];
  /**
   * The thing that generates/returns possible values / options
   */
  provider?: JsonVariableOptionProvider;
}

export interface JsonVariableOption {
  value: string;
  label: string;
  obj: unknown;
}

export interface JsonVariableOptionProvider {
  getOptions(): Observable<JsonVariableOption[]>;
}

export class JsonVariable extends SceneObjectBase<JsonVariableState> implements SceneVariable {
  public constructor(state: Partial<JsonVariableState>) {
    super({
      // @ts-ignore
      type: 'json',
      options: [],
      ...state,
    });
  }

  private static fieldAccessorCache: FieldAccessorCache = {};

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    if (!this.state.provider) {
      return of({});
    }

    return this.state.provider.getOptions().pipe(
      map((options) => {
        this.updateValueGivenNewOptions(options);
        return {};
      })
    );
  }

  private updateValueGivenNewOptions(options: JsonVariableOption[]) {
    if (!this.state.value) {
      return;
    }

    const stateUpdate: Partial<JsonVariableState> = { options };

    const found = options.find((option) => option.value === this.state.value);

    if (!found) {
      if (options.length > 0) {
        stateUpdate.value = options[0].value;
      } else {
        stateUpdate.value = undefined;
      }
    }

    this.setState(stateUpdate);
  }

  public getValueText?(fieldPath?: string): string {
    const current = this.state.options.find((option) => option.value === this.state.value);
    return current ? current.label : '';
  }

  public getValue(fieldPath: string): VariableValue {
    const current = this.state.options.find((option) => option.value === this.state.value);
    return current ? this.getFieldAccessor(fieldPath)(current.obj) : '';
  }

  private getFieldAccessor(fieldPath: string) {
    const accessor = JsonVariable.fieldAccessorCache[fieldPath];
    if (accessor) {
      return accessor;
    }

    return (JsonVariable.fieldAccessorCache[fieldPath] = property(fieldPath));
  }

  public _onChange = (selected: SelectableValue<string>) => {
    this.setState({ value: selected.value });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  };

  public static Component = ({ model }: SceneComponentProps<JsonVariable>) => {
    const { key, value, options } = model.useState();

    const current = options.find((option) => option.value === value)?.value;

    return (
      <Select
        id={key}
        placeholder="Select value"
        width="auto"
        value={current}
        tabSelectsValue={false}
        options={options}
        onChange={model._onChange}
      />
    );
  };
}

interface FieldAccessorCache {
  [key: string]: (obj: any) => any;
}
