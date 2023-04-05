import { ScopedVars } from '@grafana/data';
import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { CustomVariableValue } from '../types';

export interface MacroVariableConstructor {
  new (name: string, sceneObject: SceneObject, fullMatch: string, scopedVars?: ScopedVars): FormatVariable;
}

/**
 * The sceneInterpolator will detect if getValue returns VariableValueCustom and will skip the normal formatting
 * This is useful as otherwise we would url encode macros like $__all_variables twice.
 */
export class SkipFormattingValue implements CustomVariableValue {
  public constructor(private _value: string) {}

  public formatter(): string {
    return this._value;
  }
}
