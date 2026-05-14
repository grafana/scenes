import { ScopedVar } from '@grafana/data';

import { VariableValue } from '../types';

import { FormatVariable } from './formatRegistry';
import { getFieldAccessor } from './fieldAccessorCache';

export class ScopedVarsVariable implements FormatVariable {
  public state: { name: string; value: ScopedVar; type: string };

  public constructor(name: string, value: ScopedVar) {
    this.state = { name, value, type: 'scopedvar' };
  }

  public getValue(fieldPath: string): VariableValue {
    const { value } = this.state;
    return fieldPath ? getFieldAccessor(fieldPath)(value.value) : value.value;
  }

  public getValueText(): string {
    const { value } = this.state;

    if (value.text != null) {
      return String(value.text);
    }

    return String(value);
  }
}

let scopedVarsVariable: ScopedVarsVariable | undefined;

/**
 * Reuses a single instance to avoid unnecessary memory allocations
 */
export function getSceneVariableForScopedVar(name: string, value: ScopedVar): FormatVariable {
  if (!scopedVarsVariable) {
    scopedVarsVariable = new ScopedVarsVariable(name, value);
  } else {
    scopedVarsVariable.state.name = name;
    scopedVarsVariable.state.value = value;
  }

  return scopedVarsVariable;
}
