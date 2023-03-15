import { isEqual } from 'lodash';
import { VariableValue } from './types';

export function isVariableValueEqual(a: VariableValue | null | undefined, b: VariableValue | null | undefined) {
  if (a === b) {
    return true;
  }

  return isEqual(a, b);
}
