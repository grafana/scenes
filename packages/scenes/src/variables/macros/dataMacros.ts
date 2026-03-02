import {
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  ScopedVars,
  DataContextScopedVar,
  getFieldDisplayValuesProxy,
  getFrameDisplayName,
} from '@grafana/data';
import { SceneObject } from '../../core/types';
import { getFieldAccessor } from '../interpolation/fieldAccessorCache';
import { FormatVariable } from '../interpolation/formatRegistry';
import { VariableValue } from '../types';
import { getTemplateProxyForField } from './templateProxies';

/**
 * This macro handles the ${__value.*} interpolation
 * match represents the regex match and is the full expression, example `${varname.fieldpath}`
 * Macros can return the match when they identify that there required data context is not provided.
 * This leaves the expression intact so that it can be interpolated later when the data context is available.
 */
export class ValueMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, sceneObject: SceneObject, private _match: string, private _scopedVars?: ScopedVars) {
    this.state = { name, type: '__value' };
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

    if (rowIndex == null) {
      return this._match;
    }

    if (fieldPath === 'time') {
      const timeField = frame.fields.find((f) => f.type === FieldType.time);
      return timeField ? timeField.values[rowIndex] : undefined;
    }

    if (!field) {
      return this._match;
    }

    const value = field.values[rowIndex];
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

/**
 * This macro handles the ${__data.*} interpolation. This is a bit poorly named as most of the
 * expressions that this macro evaluates are really "row" based values enabling you to access
 * values in other fields on the same row.
 */
export class DataMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, sceneObject: SceneObject, private _match: string, private _scopedVars?: ScopedVars) {
    this.state = { name, type: '__data' };
  }

  public getValue(fieldPath?: string): VariableValue {
    const dataContext = this._scopedVars?.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }

    const { frame, rowIndex } = dataContext.value;

    if (rowIndex === undefined || fieldPath === undefined) {
      return this._match;
    }

    const obj = {
      name: frame.name,
      refId: frame.refId,
      fields: getFieldDisplayValuesProxy({ frame, rowIndex }),
    };

    return getFieldAccessor(fieldPath)(obj) ?? '';
  }

  public getValueText?(): string {
    return '';
  }
}

/**
 * This macro handles the ${__series.name} interpolation.
 */
export class SeriesMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, sceneObject: SceneObject, private _match: string, private _scopedVars?: ScopedVars) {
    this.state = { name, type: '__series' };
  }

  public getValue(fieldPath?: string): VariableValue {
    const dataContext = this._scopedVars?.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }

    if (fieldPath !== 'name') {
      return this._match;
    }

    const { frame, frameIndex } = dataContext.value;
    return getFrameDisplayName(frame, frameIndex);
  }

  public getValueText?(): string {
    return '';
  }
}

/**
 * This macro handles the ${__field.*} interpolation. These do not require a data context.
 * And can be easily used in field config options like displayName.
 */
export class FieldMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, sceneObject: SceneObject, private _match: string, private _scopedVars?: ScopedVars) {
    this.state = { name, type: '__field' };
  }

  public getValue(fieldPath?: string): VariableValue {
    const dataContext = this._scopedVars?.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }

    if (fieldPath === undefined || fieldPath === '') {
      return this._match;
    }

    const { frame, field, data } = dataContext.value;
    const obj = getTemplateProxyForField(field, frame, data);

    return getFieldAccessor(fieldPath)(obj) ?? '';
  }

  public getValueText?(): string {
    return '';
  }
}
