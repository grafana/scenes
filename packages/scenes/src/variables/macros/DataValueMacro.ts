import {
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  ScopedVars,
  DataContextScopedVar,
} from '@grafana/data';
import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { VariableValue } from '../types';

/**
 * match represents the regex match and is the full expression, example `${varname.fieldpath}`
 * Macros can return the match when they identify that there required data context is not provided.
 * This leaves the expression intact so that it can be interpolated later when the data context is available.
 */
export class DataValueMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, sceneObject: SceneObject, private _match: string, private _scopedVars?: ScopedVars) {
    this.state = { name, type: 'url_variable' };
  }

  public getValue(fieldPath?: string): VariableValue {
    const dataContext: DataContextScopedVar | undefined = this._scopedVars?.__dataContext;
    if (!dataContext) {
      return this._match;
    }

    const { frame, rowIndex, field, calculatedValue } = dataContext.value;

    if (calculatedValue) {
      switch (fieldPath) {
        case 'numeric':
          return calculatedValue.numeric;
        case 'raw':
          return calculatedValue.numeric;
        case 'time':
          return '';
        case 'text':
        default:
          return formattedValueToString(calculatedValue);
      }
    }

    if (!rowIndex) {
      return this._match;
    }

    if (fieldPath === 'time') {
      const timeField = frame.fields.find((f) => f.type === FieldType.time);
      return timeField ? timeField.values.get(rowIndex) : undefined;
    }

    if (!field) {
      return this._match;
    }

    const value = field.values.get(rowIndex);
    if (fieldPath === 'raw') {
      return value;
    }

    const displayProcessor = field.display ?? fallbackDisplayProcessor;
    const result = displayProcessor(value);

    switch (fieldPath) {
      case 'numeric':
        return result.numeric;
      case 'text':
      default:
        return formattedValueToString(result);
    }
  }

  public getValueText?(): string {
    return '';
  }
}

const fallbackDisplayProcessor = getDisplayProcessor();
