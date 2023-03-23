import { VariableValueCustom } from './types';

/**
 * Variable getValue can return this to skip any subsequent formatting.
 * This is useful for custom all values that should not be escaped/formatted.
 * This is also useful for macro variables like $__all_variables that also return pre-formatted/escaped value from getValue
 */
export class SkipFormattingValue implements VariableValueCustom {
  public skipFormatting: true = true;

  public constructor(private _value: string) {}

  public toString() {
    return this._value;
  }
}
