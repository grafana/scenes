import { isEqual } from 'lodash';
import { map, Observable } from 'rxjs';

import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObject, SceneObjectUrlSyncHandler, SceneObjectUrlValues } from '../../core/types';
import {
  SceneVariable,
  SceneVariableValueChangedEvent,
  SceneVariableState,
  ValidateAndUpdateResult,
  VariableValue,
  VariableValueOption,
  VariableValueSingle,
  CustomVariableValue,
  VariableCustomFormatterFn,
} from '../types';
import { formatRegistry } from '../interpolation/formatRegistry';
import { VariableFormatID } from '@grafana/schema';
import { SceneVariableSet } from '../sets/SceneVariableSet';

export interface MultiValueVariableState extends SceneVariableState {
  value: VariableValue; // old current.text
  text: VariableValue; // old current.value
  options: VariableValueOption[];
  isMulti?: boolean;
  includeAll?: boolean;
  defaultToAll?: boolean;
  allValue?: string;
  placeholder?: string;
}

export interface VariableGetOptionsArgs {
  searchFilter?: string;
}

export abstract class MultiValueVariable<TState extends MultiValueVariableState = MultiValueVariableState>
  extends SceneObjectBase<TState>
  implements SceneVariable<TState>
{
  protected _urlSync: SceneObjectUrlSyncHandler = new MultiValueUrlSyncHandler(this);

  /**
   * The source of value options.
   */
  public abstract getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;

  /**
   * This function is called on when SceneVariableSet is activated or when a dependency changes.
   */
  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    return this.getValueOptions({}).pipe(
      map((options) => {
        this.updateValueGivenNewOptions(options);
        return {};
      })
    );
  }

  public cancel?(): void {
    this.setStateHelper({ loading: false });
    const sceneVarSet = this.parent as SceneVariableSet;
    sceneVarSet?.cancel(this);
  }

  /**
   * Check if current value is valid given new options. If not update the value.
   */
  private updateValueGivenNewOptions(options: VariableValueOption[]) {
    const stateUpdate: Partial<MultiValueVariableState> = {
      options,
      loading: false,
      value: this.state.value,
      text: this.state.text,
    };

    if (options.length === 0) {
      // TODO handle the no value state
    } else if (this.hasAllValue()) {
      // If value is set to All then we keep it set to All but just store the options
    } else if (this.state.isMulti) {
      // If we are a multi valued variable validate the current values are among the options
      const currentValues = Array.isArray(this.state.value) ? this.state.value : [this.state.value];
      const validValues = currentValues.filter((v) => options.find((o) => o.value === v));

      // If no valid values pick the first option
      if (validValues.length === 0) {
        const defaultState = this.getDefaultMultiState(options);
        stateUpdate.value = defaultState.value;
        stateUpdate.text = defaultState.text;
      }
      // We have valid values, if it's different from current valid values update current values
      else if (!isEqual(validValues, this.state.value)) {
        const validTexts = validValues.map((v) => options.find((o) => o.value === v)!.label);
        stateUpdate.value = validValues;
        stateUpdate.text = validTexts;
      }
    } else {
      // Single valued variable
      const foundCurrent = options.find((x) => x.value === this.state.value);
      if (!foundCurrent) {
        if (this.state.defaultToAll) {
          stateUpdate.value = ALL_VARIABLE_VALUE;
          stateUpdate.text = ALL_VARIABLE_TEXT;
        } else {
          // Current value is not valid. Set to first of the available options
          stateUpdate.value = options[0].value;
          stateUpdate.text = options[0].label;
        }
      }
    }

    // Remember current value and text
    const { value: prevValue, text: prevText } = this.state;

    // Perform state change
    this.setStateHelper(stateUpdate);

    // Publish value changed event only if value changed
    if (stateUpdate.value !== prevValue || stateUpdate.text !== prevText || this.hasAllValue()) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  public getValue(): VariableValue {
    if (this.hasAllValue()) {
      if (this.state.allValue) {
        return new CustomAllValue(this.state.allValue, this);
      }

      return this.state.options.map((x) => x.value);
    }

    return this.state.value;
  }

  public getValueText(): string {
    if (this.hasAllValue()) {
      return ALL_VARIABLE_TEXT;
    }

    if (Array.isArray(this.state.text)) {
      return this.state.text.join(' + ');
    }

    return String(this.state.text);
  }

  private hasAllValue() {
    const value = this.state.value;
    return value === ALL_VARIABLE_VALUE || (Array.isArray(value) && value[0] === ALL_VARIABLE_VALUE);
  }

  private getDefaultMultiState(options: VariableValueOption[]) {
    if (this.state.defaultToAll) {
      return { value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] };
    } else {
      return { value: [options[0].value], text: [options[0].label] };
    }
  }

  /**
   * Change the value and publish SceneVariableValueChangedEvent event
   */
  public changeValueTo(value: VariableValue, text?: VariableValue) {
    // Igore if there is no change
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
      // If we are a multi valued variable is cleared (empty array) we need to set the default empty state
      if (value.length === 0) {
        const state = this.getDefaultMultiState(this.state.options);
        value = state.value;
        text = state.text;
      }

      // If last value is the All value then replace all with it
      if (value[value.length - 1] === ALL_VARIABLE_VALUE) {
        value = [ALL_VARIABLE_VALUE];
        text = [ALL_VARIABLE_TEXT];
      }
      // If the first value is the ALL value and we have other values, then remove the All value
      else if (value[0] === ALL_VARIABLE_VALUE && value.length > 1) {
        value.shift();
        if (Array.isArray(text)) {
          text.shift();
        }
      }
    }

    this.setStateHelper({ value, text, loading: false });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  }

  private findLabelTextForValue(value: VariableValueSingle): VariableValueSingle {
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

  /**
   * This helper function is to counter the contravariance of setState
   */
  private setStateHelper(state: Partial<MultiValueVariableState>) {
    const test: SceneObject<MultiValueVariableState> = this;
    test.setState(state);
  }

  public getOptionsForSelect(): VariableValueOption[] {
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
}

export class MultiValueUrlSyncHandler<TState extends MultiValueVariableState = MultiValueVariableState>
  implements SceneObjectUrlSyncHandler
{
  public constructor(private _sceneObject: MultiValueVariable<TState>) {}

  private getKey(): string {
    return `var-${this._sceneObject.state.name}`;
  }

  public getKeys(): string[] {
    return [this.getKey()];
  }

  public getUrlState(): SceneObjectUrlValues {
    let urlValue: string | string[] | null = null;
    let value = this._sceneObject.state.value;

    if (Array.isArray(value)) {
      urlValue = value.map(String);
    } else {
      urlValue = String(value);
    }

    return { [this.getKey()]: urlValue };
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    const urlValue = values[this.getKey()];

    if (urlValue != null) {
      this._sceneObject.changeValueTo(urlValue);
    }
  }
}

/**
 * Variable getValue can return this to skip any subsequent formatting.
 * This is useful for custom all values that should not be escaped/formatted.
 */
export class CustomAllValue implements CustomVariableValue {
  public constructor(private _value: string, private _variable: SceneVariable) {}

  public formatter(formatNameOrFn?: string | VariableCustomFormatterFn): string {
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
