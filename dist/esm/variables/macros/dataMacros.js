import { getDisplayProcessor, formattedValueToString, FieldType, getFieldDisplayValuesProxy, getFrameDisplayName } from '@grafana/data';
import { getFieldAccessor } from '../interpolation/fieldAccessorCache.js';
import { getTemplateProxyForField } from './templateProxies.js';

class ValueMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__value" };
  }
  getValue(fieldPath) {
    var _a, _b;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext) {
      return this._match;
    }
    const { frame, rowIndex, field, calculatedValue } = dataContext.value;
    if (calculatedValue) {
      switch (fieldPath) {
        case "numeric":
          return calculatedValue.numeric;
        case "raw":
          return calculatedValue.numeric;
        case "time":
          return "";
        case "text":
        default:
          return formattedValueToString(calculatedValue);
      }
    }
    if (rowIndex == null) {
      return this._match;
    }
    if (fieldPath === "time") {
      const timeField = frame.fields.find((f) => f.type === FieldType.time);
      return timeField ? timeField.values.get(rowIndex) : void 0;
    }
    if (!field) {
      return this._match;
    }
    const value = field.values.get(rowIndex);
    if (fieldPath === "raw") {
      return value;
    }
    const displayProcessor = (_b = field.display) != null ? _b : fallbackDisplayProcessor;
    const result = displayProcessor(value);
    switch (fieldPath) {
      case "numeric":
        return result.numeric;
      case "text":
      default:
        return formattedValueToString(result);
    }
  }
  getValueText() {
    return "";
  }
}
const fallbackDisplayProcessor = getDisplayProcessor();
class DataMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__data" };
  }
  getValue(fieldPath) {
    var _a, _b;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }
    const { frame, rowIndex } = dataContext.value;
    if (rowIndex === void 0 || fieldPath === void 0) {
      return this._match;
    }
    const obj = {
      name: frame.name,
      refId: frame.refId,
      fields: getFieldDisplayValuesProxy({ frame, rowIndex })
    };
    return (_b = getFieldAccessor(fieldPath)(obj)) != null ? _b : "";
  }
  getValueText() {
    return "";
  }
}
class SeriesMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__series" };
  }
  getValue(fieldPath) {
    var _a;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }
    if (fieldPath !== "name") {
      return this._match;
    }
    const { frame, frameIndex } = dataContext.value;
    return getFrameDisplayName(frame, frameIndex);
  }
  getValueText() {
    return "";
  }
}
class FieldMacro {
  constructor(name, sceneObject, _match, _scopedVars) {
    this._match = _match;
    this._scopedVars = _scopedVars;
    this.state = { name, type: "__field" };
  }
  getValue(fieldPath) {
    var _a, _b;
    const dataContext = (_a = this._scopedVars) == null ? void 0 : _a.__dataContext;
    if (!dataContext || !fieldPath) {
      return this._match;
    }
    if (fieldPath === void 0 || fieldPath === "") {
      return this._match;
    }
    const { frame, field, data } = dataContext.value;
    const obj = getTemplateProxyForField(field, frame, data);
    return (_b = getFieldAccessor(fieldPath)(obj)) != null ? _b : "";
  }
  getValueText() {
    return "";
  }
}

export { DataMacro, FieldMacro, SeriesMacro, ValueMacro };
//# sourceMappingURL=dataMacros.js.map
