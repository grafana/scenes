import { isArray, isEqual } from 'lodash';
import { map, Observable } from 'rxjs';

import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObjectUrlSyncHandler, SceneObjectUrlValues } from '../../core/types';
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
import { setBaseClassState } from '../../utils/utils';
import { VARIABLE_VALUE_CHANGED_INTERACTION } from '../../performance/interactionConstants';
import { getQueryController } from '../../core/sceneGraph/getQueryController';

export interface MultiValueVariableState extends SceneVariableState {
  value: VariableValue; // old current.text
  text: VariableValue; // old current.value
  options: VariableValueOption[];
  allowCustomValue?: boolean;
  isMulti?: boolean;
  includeAll?: boolean;
  defaultToAll?: boolean;
  allValue?: string;
  placeholder?: string;
  /**
   * For multi value variables, this option controls how many values to show before they are collapsed into +N.
   * Defaults to 5
   */
  maxVisibleValues?: number;
  noValueOnClear?: boolean;
  isReadOnly?: boolean;
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
   * Set to true to skip next value validation to maintain the current value even it it's not among the options (ie valid values)
   */
  public skipNextValidation?: boolean;

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

  public onCancel(): void {
    this.setStateHelper({ loading: false });
    const sceneVarSet = this.parent as SceneVariableSet;
    sceneVarSet?.cancel(this);
  }

  /**
   * Check if current value is valid given new options. If not update the value.
   */
  private updateValueGivenNewOptions(options: VariableValueOption[]) {
    // Remember current value and text
    const { value: currentValue, text: currentText, options: oldOptions } = this.state;

    const stateUpdate = this.getStateUpdateGivenNewOptions(options, currentValue, currentText);

    this.interceptStateUpdateAfterValidation(stateUpdate);

    // Perform state change
    this.setStateHelper(stateUpdate);

    // Publish value changed event only if value changed
    if (
      stateUpdate.value !== currentValue ||
      stateUpdate.text !== currentText ||
      (this.hasAllValue() && !isEqual(options, oldOptions))
    ) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  private getStateUpdateGivenNewOptions(
    options: VariableValueOption[],
    currentValue: VariableValue,
    currentText: VariableValue
  ): Partial<MultiValueVariableState> {
    const stateUpdate: Partial<MultiValueVariableState> = {
      options,
      loading: false,
      value: currentValue,
      text: currentText,
    };

    if (options.length === 0) {
      if (this.state.defaultToAll || this.state.includeAll) {
        stateUpdate.value = ALL_VARIABLE_VALUE;
        stateUpdate.text = ALL_VARIABLE_TEXT;
      } else if (this.state.isMulti) {
        stateUpdate.value = [];
        stateUpdate.text = [];
      } else {
        stateUpdate.value = '';
        stateUpdate.text = '';
      }

      return stateUpdate;
    }

    if (this.hasAllValue()) {
      if (this.state.includeAll) {
        // Sometimes the text representation is also set the ALL_VARIABLE_VALUE, this fixes that
        stateUpdate.text = ALL_VARIABLE_TEXT;
      } else {
        stateUpdate.value = options[0].value;
        stateUpdate.text = options[0].label;
        // If multi switch to arrays
        if (this.state.isMulti) {
          stateUpdate.value = [stateUpdate.value];
          stateUpdate.text = [stateUpdate.text];
        }
      }
      return stateUpdate;
    }

    if (this.state.isMulti) {
      // If we are a multi valued variable validate the current values are among the options
      const currentValues = Array.isArray(currentValue) ? currentValue : [currentValue];
      const validValues = currentValues.filter((v) => options.find((o) => o.value === v));
      const validTexts = validValues.map((v) => options.find((o) => o.value === v)!.label);

      // If no valid values pick the first option
      if (validValues.length === 0) {
        const defaultState = this.getDefaultMultiState(options);
        stateUpdate.value = defaultState.value;
        stateUpdate.text = defaultState.text;
      } else {
        // We have valid values, if it's different from current valid values update current values
        if (!isEqual(validValues, currentValue)) {
          stateUpdate.value = validValues;
        }
        if (!isEqual(validTexts, currentText)) {
          stateUpdate.text = validTexts;
        }
      }
      return stateUpdate;
    }

    // Single value variable validation

    // Try find by value then text
    let matchingOption = findOptionMatchingCurrent(currentValue, currentText, options);
    if (matchingOption) {
      // When updating the initial state from URL the text property is set the same as value
      // Here we can correct the text value state
      stateUpdate.text = matchingOption.label;
      stateUpdate.value = matchingOption.value;
    } else {
      // Current value is found in options
      const defaultState = this.getDefaultSingleState(options);
      stateUpdate.value = defaultState.value;
      stateUpdate.text = defaultState.text;
    }

    return stateUpdate;
  }

  /**
   * Values set by initial URL sync needs to survive the next validation and update.
   * This function can intercept and make sure those values are preserved.
   */
  protected interceptStateUpdateAfterValidation(stateUpdate: Partial<MultiValueVariableState>): void {
    // If the validation wants to fix the all value (All ==> $__all) then we should let that pass
    const isAllValueFix = stateUpdate.value === ALL_VARIABLE_VALUE && this.state.text === ALL_VARIABLE_TEXT;

    if (
      this.skipNextValidation &&
      stateUpdate.value !== this.state.value &&
      stateUpdate.text !== this.state.text &&
      !isAllValueFix
    ) {
      stateUpdate.value = this.state.value;
      stateUpdate.text = this.state.text;
    }

    this.skipNextValidation = false;
  }

  public getValue(fieldPath?: string): VariableValue {
    let value = this.state.value;

    if (this.hasAllValue()) {
      if (this.state.allValue) {
        return new CustomAllValue(this.state.allValue, this);
      }

      value = this.state.options.map((x) => x.value);
    }

    if (fieldPath != null && Array.isArray(value)) {
      const index = parseInt(fieldPath, 10);
      if (!isNaN(index) && index >= 0 && index < value.length) {
        return value[index];
      }
    }

    return value;
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

  public hasAllValue() {
    const value = this.state.value;
    return value === ALL_VARIABLE_VALUE || (Array.isArray(value) && value[0] === ALL_VARIABLE_VALUE);
  }

  public getDefaultMultiState(options: VariableValueOption[]) {
    if (this.state.defaultToAll) {
      return { value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] };
    } else if (options.length > 0) {
      return { value: [options[0].value], text: [options[0].label] };
    } else {
      return { value: [], text: [] };
    }
  }

  protected getDefaultSingleState(options: VariableValueOption[]) {
    if (this.state.defaultToAll) {
      return { value: ALL_VARIABLE_VALUE, text: ALL_VARIABLE_TEXT };
    } else if (options.length > 0) {
      return { value: options[0].value, text: options[0].label };
    } else {
      return { value: '', text: '' };
    }
  }

  /**
   * Change the value and publish SceneVariableValueChangedEvent event.
   */
  public changeValueTo(value: VariableValue, text?: VariableValue, isUserAction = false) {
    // Ignore if there is no change
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

    // Do nothing if value and text are the same
    if (isEqual(value, this.state.value) && isEqual(text, this.state.text)) {
      return;
    }

    const stateChangeAction = () => this.setStateHelper({ value, text, loading: false });
    /**
     * Because variable state changes can cause a whole chain of downstream state changes in other variables (that also cause URL update)
     * Only some variable changes should add new history items to make sure the browser history contains valid URL states to go back to.
     */
    if (isUserAction) {
      const queryController = getQueryController(this);
      queryController?.startProfile(VARIABLE_VALUE_CHANGED_INTERACTION);
      this._urlSync.performBrowserHistoryAction?.(stateChangeAction);
    } else {
      stateChangeAction();
    }

    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  }

  private findLabelTextForValue(value: VariableValueSingle): VariableValueSingle {
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

  /**
   * This helper function is to counter the contravariance of setState
   */
  private setStateHelper(state: Partial<MultiValueVariableState>) {
    setBaseClassState<MultiValueVariableState>(this, state);
  }

  public getOptionsForSelect(includeCurrentValue = true): VariableValueOption[] {
    let options = this.state.options;

    if (this.state.includeAll) {
      options = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...options];
    }

    if (includeCurrentValue && !Array.isArray(this.state.value)) {
      const current = options.find((x) => x.value === this.state.value);
      if (!current) {
        options = [{ value: this.state.value, label: String(this.state.text) }, ...options];
      }
    }

    return options;
  }

  public refreshOptions() {
    this.getValueOptions({}).subscribe((options) => {
      this.updateValueGivenNewOptions(options);
    });
  }

  /**
   * Can be used by subclasses to do custom handling of option search based on search input
   */
  public onSearchChange?(searchFilter: string): void;
}

/**
 * Looks for matching option, first by value but as a fallback by text (label).
 */
function findOptionMatchingCurrent(
  currentValue: VariableValue,
  currentText: VariableValue,
  options: VariableValueOption[]
) {
  let textMatch: VariableValueOption | undefined;

  for (const item of options) {
    if (item.value === currentValue) {
      return item;
    }

    // No early return here as want to continue to look a value match
    if (item.label === currentText) {
      textMatch = item;
    }
  }

  return textMatch;
}

export class MultiValueUrlSyncHandler<TState extends MultiValueVariableState = MultiValueVariableState>
  implements SceneObjectUrlSyncHandler
{
  protected _nextChangeShouldAddHistoryStep = false;

  public constructor(protected _sceneObject: MultiValueVariable<TState>) {}

  protected getKey(): string {
    return `var-${this._sceneObject.state.name}`;
  }

  public getKeys(): string[] {
    if (this._sceneObject.state.skipUrlSync) {
      return [];
    }

    return [this.getKey()];
  }

  public getUrlState(): SceneObjectUrlValues {
    if (this._sceneObject.state.skipUrlSync) {
      return {};
    }

    let urlValue: string | string[] | null = null;
    let value = this._sceneObject.state.value;

    if (Array.isArray(value)) {
      urlValue = value.map(String);
    } else if ((this, this._sceneObject.state.isMulti)) {
      // If we are inMulti mode we must return an array here as otherwise UrlSyncManager will not pass all values (in an array) in updateFromUrl
      urlValue = [String(value)];
    } else {
      urlValue = String(value);
    }

    return { [this.getKey()]: urlValue };
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    let urlValue = values[this.getKey()];

    if (urlValue != null) {
      // This is to be backwards compatible with old url all value
      if (this._sceneObject.state.includeAll) {
        urlValue = handleLegacyUrlAllValue(urlValue);
      }

      // For edge cases where data links include variables with custom all value.
      // We want the variable to maintain the "All" meta value not the actual custom vall value. (Fixes https://github.com/grafana/grafana/issues/28635)
      if (this._sceneObject.state.allValue && this._sceneObject.state.allValue === urlValue) {
        urlValue = ALL_VARIABLE_VALUE;
      }

      /**
       * Initial URL Sync happens before scene objects are activated.
       * We need to skip validation in this case to make sure values set via URL are maintained.
       */
      if (!this._sceneObject.isActive) {
        this._sceneObject.skipNextValidation = true;
      }

      this._sceneObject.changeValueTo(urlValue);
    }
  }

  public performBrowserHistoryAction(callback: () => void) {
    this._nextChangeShouldAddHistoryStep = true;
    callback();
    this._nextChangeShouldAddHistoryStep = false;
  }

  public shouldCreateHistoryStep(values: SceneObjectUrlValues): boolean {
    return this._nextChangeShouldAddHistoryStep;
  }
}

function handleLegacyUrlAllValue(value: string | string[]) {
  if (isArray(value) && value[0] === ALL_VARIABLE_TEXT) {
    return [ALL_VARIABLE_VALUE];
  } else if (value === ALL_VARIABLE_TEXT) {
    return ALL_VARIABLE_VALUE;
  }

  return value;
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
