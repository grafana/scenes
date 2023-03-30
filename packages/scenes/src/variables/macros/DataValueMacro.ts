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

export class DataValueMacro implements FormatVariable {
  public state: { name: string; type: string };
  private _scopedVars: ScopedVars | undefined;

  public constructor(name: string, sceneObject: SceneObject, scopedVars?: ScopedVars) {
    this.state = { name, type: 'url_variable' };
    this._scopedVars = scopedVars;
  }

  public getValue(fieldPath?: string): VariableValue {
    const dataContext: DataContextScopedVar | undefined = this._scopedVars?.__dataContext;
    if (!dataContext) {
      return '';
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
      return '';
    }

    if (fieldPath === 'time') {
      const timeField = frame.fields.find((f) => f.type === FieldType.time);
      return timeField ? timeField.values.get(rowIndex) : undefined;
    }

    if (!field) {
      return '';
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
