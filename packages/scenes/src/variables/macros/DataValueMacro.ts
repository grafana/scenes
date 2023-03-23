import { Field, formattedValueToString, getDisplayProcessor, ScopedVars } from '@grafana/data';
import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { VariableValue } from '../types';

export interface DataContextScopedVar {
  value: {
    field: Field;
    timeField?: Field;
    valueRowIndex?: number;
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

    const { field, valueRowIndex, timeField } = dataContext.value;

    if (!valueRowIndex) {
      return '';
    }

    if (fieldPath === 'time') {
      return timeField ? timeField.values.get(valueRowIndex) : undefined;
    }

    const value = field.values.get(valueRowIndex);
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
        console.log('formatting', result);
        return formattedValueToString(result);
    }
  }

  public getValueText?(): string {
    return '';
  }
}

const fallbackDisplayProcessor = getDisplayProcessor();
