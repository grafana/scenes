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
    let { value } = this.state;
    let realValue = value.value;

    if (fieldPath) {
      realValue = getFieldAccessor(fieldPath)(value.value);
    } else {
      realValue = value.value;
    }

    if (realValue === 'string' || realValue === 'number' || realValue === 'boolean') {
      return realValue;
    }

    return String(realValue);
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
