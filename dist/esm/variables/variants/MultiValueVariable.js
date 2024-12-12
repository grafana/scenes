import { isEqual, isArray } from 'lodash';
import { map } from 'rxjs';
import { ALL_VARIABLE_VALUE, ALL_VARIABLE_TEXT } from '../constants.js';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { SceneVariableValueChangedEvent } from '../types.js';
import { formatRegistry } from '../interpolation/formatRegistry.js';
import { VariableFormatID } from '@grafana/schema';
import { setBaseClassState } from '../../utils/utils.js';

class MultiValueVariable extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this._urlSync = new MultiValueUrlSyncHandler(this);
  }
  validateAndUpdate() {
    return this.getValueOptions({}).pipe(
      map((options) => {
        this.updateValueGivenNewOptions(options);
        return {};
      })
    );
  }
  onCancel() {
    this.setStateHelper({ loading: false });
    const sceneVarSet = this.parent;
    sceneVarSet == null ? void 0 : sceneVarSet.cancel(this);
  }
  updateValueGivenNewOptions(options) {
    const { value: currentValue, text: currentText, options: oldOptions } = this.state;
    const stateUpdate = this.getStateUpdateGivenNewOptions(options, currentValue, currentText);
    this.interceptStateUpdateAfterValidation(stateUpdate);
    this.setStateHelper(stateUpdate);
    if (stateUpdate.value !== currentValue || stateUpdate.text !== currentText || this.hasAllValue() && !isEqual(options, oldOptions)) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
  getStateUpdateGivenNewOptions(options, currentValue, currentText) {
    const stateUpdate = {
      options,
      loading: false,
      value: currentValue,
      text: currentText
    };
    if (options.length === 0) {
      if (this.state.defaultToAll || this.state.includeAll) {
        stateUpdate.value = ALL_VARIABLE_VALUE;
        stateUpdate.text = ALL_VARIABLE_TEXT;
      } else if (this.state.isMulti) {
        stateUpdate.value = [];
        stateUpdate.text = [];
      } else {
        stateUpdate.value = "";
        stateUpdate.text = "";
      }
      return stateUpdate;
    }
    if (this.hasAllValue()) {
      if (!this.state.includeAll) {
        stateUpdate.value = options[0].value;
        stateUpdate.text = options[0].label;
        if (this.state.isMulti) {
          stateUpdate.value = [stateUpdate.value];
          stateUpdate.text = [stateUpdate.text];
        }
      }
      return stateUpdate;
    }
    if (this.state.isMulti) {
      const currentValues = Array.isArray(currentValue) ? currentValue : [currentValue];
      const validValues = currentValues.filter((v) => options.find((o) => o.value === v));
      const validTexts = validValues.map((v) => options.find((o) => o.value === v).label);
      if (validValues.length === 0) {
        const defaultState = this.getDefaultMultiState(options);
        stateUpdate.value = defaultState.value;
        stateUpdate.text = defaultState.text;
      } else {
        if (!isEqual(validValues, currentValue)) {
          stateUpdate.value = validValues;
        }
        if (!isEqual(validTexts, currentText)) {
          stateUpdate.text = validTexts;
        }
      }
      return stateUpdate;
    }
    let matchingOption = findOptionMatchingCurrent(currentValue, currentText, options);
    if (matchingOption) {
      stateUpdate.text = matchingOption.label;
      stateUpdate.value = matchingOption.value;
    } else {
      if (this.state.defaultToAll) {
        stateUpdate.value = ALL_VARIABLE_VALUE;
        stateUpdate.text = ALL_VARIABLE_TEXT;
      } else {
        stateUpdate.value = options[0].value;
        stateUpdate.text = options[0].label;
      }
    }
    return stateUpdate;
  }
  interceptStateUpdateAfterValidation(stateUpdate) {
    const isAllValueFix = stateUpdate.value === ALL_VARIABLE_VALUE && this.state.text === ALL_VARIABLE_TEXT;
    if (this.skipNextValidation && stateUpdate.value !== this.state.value && stateUpdate.text !== this.state.text && !isAllValueFix) {
      stateUpdate.value = this.state.value;
      stateUpdate.text = this.state.text;
    }
    this.skipNextValidation = false;
  }
  getValue() {
    if (this.hasAllValue()) {
      if (this.state.allValue) {
        return new CustomAllValue(this.state.allValue, this);
      }
      return this.state.options.map((x) => x.value);
    }
    return this.state.value;
  }
  getValueText() {
    if (this.hasAllValue()) {
      return ALL_VARIABLE_TEXT;
    }
    if (Array.isArray(this.state.text)) {
      return this.state.text.join(" + ");
    }
    return String(this.state.text);
  }
  hasAllValue() {
    const value = this.state.value;
    return value === ALL_VARIABLE_VALUE || Array.isArray(value) && value[0] === ALL_VARIABLE_VALUE;
  }
  getDefaultMultiState(options) {
    if (this.state.defaultToAll) {
      return { value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] };
    } else if (options.length > 0) {
      return { value: [options[0].value], text: [options[0].label] };
    } else {
      return { value: [], text: [] };
    }
  }
  changeValueTo(value, text) {
    if (value === this.state.value && text === this.state.text) {
      return;
    }
    if (!text) {
      if (Array.isArray(value)) {
        text = value.map((v) => this.findLabelTextForValue(v));
      } else {
        text = this.findLabelTextForValue(value);
      }
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        const state = this.getDefaultMultiState(this.state.options);
        value = state.value;
        text = state.text;
      }
      if (value[value.length - 1] === ALL_VARIABLE_VALUE) {
        value = [ALL_VARIABLE_VALUE];
        text = [ALL_VARIABLE_TEXT];
      } else if (value[0] === ALL_VARIABLE_VALUE && value.length > 1) {
        value.shift();
        if (Array.isArray(text)) {
          text.shift();
        }
      }
    }
    if (isEqual(value, this.state.value) && isEqual(text, this.state.text)) {
      return;
    }
    this.setStateHelper({ value, text, loading: false });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  }
  findLabelTextForValue(value) {
    if (value === ALL_VARIABLE_VALUE) {
      return ALL_VARIABLE_TEXT;
    }
    const option = this.state.options.find((x) => x.value === value);
    if (option) {
      return option.label;
    }
    const optionByLabel = this.state.options.find((x) => x.label === value);
    if (optionByLabel) {
      return optionByLabel.label;
    }
    return value;
  }
  setStateHelper(state) {
    setBaseClassState(this, state);
  }
  getOptionsForSelect() {
    let options = this.state.options;
    if (this.state.includeAll) {
      options = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...options];
    }
    if (!Array.isArray(this.state.value)) {
      const current = options.find((x) => x.value === this.state.value);
      if (!current) {
        options = [{ value: this.state.value, label: String(this.state.text) }, ...options];
      }
    }
    return options;
  }
  refreshOptions() {
    this.getValueOptions({}).subscribe((options) => {
      this.updateValueGivenNewOptions(options);
    });
  }
}
function findOptionMatchingCurrent(currentValue, currentText, options) {
  let textMatch;
  for (const item of options) {
    if (item.value === currentValue) {
      return item;
    }
    if (item.label === currentText) {
      textMatch = item;
    }
  }
  return textMatch;
}
class MultiValueUrlSyncHandler {
  constructor(_sceneObject) {
    this._sceneObject = _sceneObject;
  }
  getKey() {
    return `var-${this._sceneObject.state.name}`;
  }
  getKeys() {
    if (this._sceneObject.state.skipUrlSync) {
      return [];
    }
    return [this.getKey()];
  }
  getUrlState() {
    if (this._sceneObject.state.skipUrlSync) {
      return {};
    }
    let urlValue = null;
    let value = this._sceneObject.state.value;
    if (Array.isArray(value)) {
      urlValue = value.map(String);
    } else if (this._sceneObject.state.isMulti) {
      urlValue = [String(value)];
    } else {
      urlValue = String(value);
    }
    return { [this.getKey()]: urlValue };
  }
  updateFromUrl(values) {
    let urlValue = values[this.getKey()];
    if (urlValue != null) {
      if (this._sceneObject.state.includeAll) {
        urlValue = handleLegacyUrlAllValue(urlValue);
      }
      if (this._sceneObject.state.allValue && this._sceneObject.state.allValue === urlValue) {
        urlValue = ALL_VARIABLE_VALUE;
      }
      if (!this._sceneObject.isActive) {
        this._sceneObject.skipNextValidation = true;
      }
      this._sceneObject.changeValueTo(urlValue);
    }
  }
}
function handleLegacyUrlAllValue(value) {
  if (isArray(value) && value[0] === ALL_VARIABLE_TEXT) {
    return [ALL_VARIABLE_VALUE];
  } else if (value === ALL_VARIABLE_TEXT) {
    return ALL_VARIABLE_VALUE;
  }
  return value;
}
class CustomAllValue {
  constructor(_value, _variable) {
    this._value = _value;
    this._variable = _variable;
  }
  formatter(formatNameOrFn) {
    if (formatNameOrFn === VariableFormatID.Text) {
      return ALL_VARIABLE_TEXT;
    }
    if (formatNameOrFn === VariableFormatID.PercentEncode) {
      return formatRegistry.get(VariableFormatID.PercentEncode).formatter(this._value, [], this._variable);
    }
    if (formatNameOrFn === VariableFormatID.QueryParam) {
      return formatRegistry.get(VariableFormatID.QueryParam).formatter(ALL_VARIABLE_TEXT, [], this._variable);
    }
    return this._value;
  }
}

export { CustomAllValue, MultiValueUrlSyncHandler, MultiValueVariable };
//# sourceMappingURL=MultiValueVariable.js.map
