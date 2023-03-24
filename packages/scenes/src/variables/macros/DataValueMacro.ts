import { DataFrame, FieldType, formattedValueToString, getDisplayProcessor, ScopedVars } from '@grafana/data';
import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { VariableValue } from '../types';

export interface DataContextScopedVar {
  value: {
    frame: DataFrame;
    fieldIndex: number;
    valueIndex: number;
  };
}

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

    const { frame, valueIndex, fieldIndex } = dataContext.value;

    if (!valueIndex) {
      return '';
    }

    if (fieldPath === 'time') {
      const timeField = frame.fields.find((f) => f.type === FieldType.time);
      return timeField ? timeField.values.get(valueIndex) : undefined;
    }

    const field = frame.fields[fieldIndex];
    if (!field) {
      return '';
    }

    const value = field.values.get(valueIndex);
    if (fieldPath === 'raw') {
      return value;
    }

    const displayProcessor = field.display ?? fallbackDisplayProcessor;
    const result = displayProcessor(value);

    switch (fieldPath) {
      case 'text':
        return result.text;
      case 'numeric':
        return result.numeric;
      default:
        return formattedValueToString(result);
    }
  }

  public getValueText?(): string {
    return '';
  }
}

const fallbackDisplayProcessor = getDisplayProcessor();
