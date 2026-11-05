import { t } from '@grafana/i18n';
import { isArray } from 'lodash';
import React, { RefCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Checkbox,
  InputActionMeta,
  MultiSelect,
  Select,
  ToggleAllState,
  getSelectStyles,
  useStyles2,
  useTheme2,
} from '@grafana/ui';

import { MultiValueVariable, MultiValueVariableState } from '../variants/MultiValueVariable';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { VariableValue, VariableValueSingle } from '../types';
import { selectors } from '@grafana/e2e-selectors';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { getOptionSearcher } from './getOptionSearcher';
import { sceneGraph } from '../../core/sceneGraph';
import { VARIABLE_VALUE_CHANGED_INTERACTION } from '../../performance/interactionConstants';
import { getVariableControlId } from '../utils';

const filterNoOp = () => true;

const filterAll = (v: SelectableValue<VariableValueSingle>) => v.value !== ALL_VARIABLE_VALUE;

const isAllVariableValue = (selected: VariableValueSingle[]) =>
  selected.length === 1 && selected[0] === ALL_VARIABLE_VALUE;

const getIndividualValues = (options: Array<SelectableValue<VariableValueSingle>>) =>
  options.filter(filterAll).map((o) => o.value!);

/** True when every value is selected (`$__all` or every individual). */
const isFullySelected = (selected: VariableValueSingle[], individualValues: VariableValueSingle[]) =>
  isAllVariableValue(selected) ||
  (individualValues.length > 0 && individualValues.every((v) => selected.includes(v)));

const determineToggleAllState = (
  selectedValues: Array<SelectableValue<VariableValueSingle>>,
  options: Array<SelectableValue<VariableValueSingle>>
) => {
  const selected = selectedValues.map((v) => v.value as VariableValueSingle);
  const individualValues = getIndividualValues(options);

  if (isFullySelected(selected, individualValues)) {
    return ToggleAllState.allSelected;
  }
  if (selected.length === 0) {
    return ToggleAllState.noneSelected;
  }
  return ToggleAllState.indeterminate;
};

/** Count for "Selected (n)" — `$__all` counts as every individual option, not 1 */
export function getVariableSelectedCount(
  selectedValues: Array<SelectableValue<VariableValueSingle>>,
  options: Array<SelectableValue<VariableValueSingle>>
) {
  const selected = selectedValues.map((v) => v.value as VariableValueSingle);
  if (isAllVariableValue(selected)) {
    return getIndividualValues(options).length;
  }
  return selected.filter((v) => v !== ALL_VARIABLE_VALUE).length;
}


export function toSelectableValue<T>(value: T, label?: string): SelectableValue<T> {
  return {
    value,
    label: label ?? String(value),
  };
}

export function VariableValueSelect({ model, state }: { model: MultiValueVariable; state: MultiValueVariableState }) {
  const { value, text, key, options, includeAll, isReadOnly, allowCustomValue = true } = state;
  const [inputValue, setInputValue] = useState('');
  const [hasCustomValue, setHasCustomValue] = useState(false);
  // The All option is only localized for display. state.text stays ALL_VARIABLE_TEXT because it
  // feeds interpolation (${var:text}) and the legacy `All` URL value.
  const selectValue = toSelectableValue(
    value,
    value === ALL_VARIABLE_VALUE ? t('grafana-scenes.variables.variable-value-select.all-label', 'All') : String(text)
  );
  const queryController = sceneGraph.getQueryController(model);
  const optionSearcher = useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);

  const onInputChange = (value: string, { action }: InputActionMeta) => {
    if (action === 'input-change') {
      setInputValue(value);
      if (model.onSearchChange) {
        model.onSearchChange!(value);
      }
      return value;
    }

    return value;
  };

  const filteredOptions = optionSearcher(inputValue);

  const onOpenMenu = () => {
    if (hasCustomValue) {
      setInputValue(String(text));
    }
  };

  const onCloseMenu = () => {
    setInputValue('');
  };

  return (
    <Select<VariableValue>
      id={key}
      inputId={getVariableControlId(model.state.type, key)}
      isValidNewOption={(inputValue) => inputValue.trim().length > 0}
      placeholder={t('grafana-scenes.variables.variable-value-select.placeholder-select-value', 'Select value')}
      width="auto"
      disabled={isReadOnly}
      value={selectValue}
      inputValue={inputValue}
      allowCustomValue={allowCustomValue}
      virtualized
      filterOption={filterNoOp}
      tabSelectsValue={false}
      onInputChange={onInputChange}
      onOpenMenu={onOpenMenu}
      onCloseMenu={onCloseMenu}
      options={filteredOptions}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${value}`)}
      onChange={(newValue) => {
        // Never let the localized All label reach the variable state, see selectValue above
        const text = newValue.value === ALL_VARIABLE_VALUE ? ALL_VARIABLE_TEXT : newValue.label!;
        model.changeValueTo(newValue.value!, text, true);
        queryController?.startProfile(VARIABLE_VALUE_CHANGED_INTERACTION);

        if (hasCustomValue !== newValue.__isNew__) {
          setHasCustomValue(newValue.__isNew__);
        }
      }}
    />
  );
}

export function VariableValueSelectMulti({
  model,
  state,
}: {
  model: MultiValueVariable;
  state: MultiValueVariableState;
}) {
  const { value, options, key, maxVisibleValues, includeAll, isReadOnly, allowCustomValue = true } = state;
  const arrayValue = useMemo(() => (isArray(value) ? value : [value]), [value]);
  // To not trigger queries on every selection we store this state locally here and only update the variable onBlur
  const [uncommittedValue, setUncommittedValue] = useState<VariableValueSingle[] | undefined>(undefined);
  const uncommittedValueRef = useRef(uncommittedValue);
  // When true, committing [] means the user unchecked All (do not fall back to `$__all`)
  const clearedByAllToggleRef = useRef(false);
  const [inputValue, setInputValue] = useState('');

  const selectedValue = uncommittedValue ?? arrayValue;
  const optionSearcher = useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);

  const updateUncommitted = (next: VariableValueSingle[] | undefined, fromAllToggle = false) => {
    clearedByAllToggleRef.current = fromAllToggle && Array.isArray(next) && next.length === 0;
    uncommittedValueRef.current = next;
    setUncommittedValue(next);
  };

  // Detect value changes outside
  useEffect(() => {
    uncommittedValueRef.current = undefined;
    clearedByAllToggleRef.current = false;
    setUncommittedValue(undefined);
  }, [arrayValue]);

  const commitValue = (next: VariableValueSingle[]) => {
    const allowEmpty = next.length === 0 && clearedByAllToggleRef.current;
    clearedByAllToggleRef.current = false;
    // allowEmpty keeps [] after unchecking All (still goes through history / query profile)
    model.changeValueTo(next, undefined, true, allowEmpty ? { allowEmpty: true } : undefined);
  };

  const onInputChange = (value: string, { action }: InputActionMeta) => {
    if (action === 'input-change') {
      setInputValue(value);
      if (model.onSearchChange) {
        model.onSearchChange!(value);
      }
      return value;
    }

    if (action === 'input-blur') {
      setInputValue('');
      return '';
    }

    return inputValue;
  };

  const placeholder =
    options.length > 0
      ? t('grafana-scenes.variables.variable-value-select.placeholder-select-value', 'Select value')
      : '';
  const filteredOptions = optionSearcher(inputValue);
  // Full list (ignores search filter) so All selects/deselects every value
  const allIndividualValues = useMemo(() => getIndividualValues(optionSearcher('')), [optionSearcher]);
  const fullySelected = isFullySelected(selectedValue, allIndividualValues);

  // When `$__all` is stored, every option appears checked. All also appears checked when every individual is selected.
  const isOptionSelected = (
    option: SelectableValue<VariableValueSingle>,
    selectValue: ReadonlyArray<SelectableValue<VariableValueSingle>>
  ) => {
    const selected = selectValue.map((v) => v.value as VariableValueSingle);
    if (isAllVariableValue(selected)) {
      return true;
    }
    if (option.value === ALL_VARIABLE_VALUE) {
      return isFullySelected(selected, allIndividualValues);
    }
    return selected.includes(option.value as VariableValueSingle);
  };

  return (
    <MultiSelect<VariableValueSingle>
      id={key}
      inputId={getVariableControlId(model.state.type, key)}
      placeholder={placeholder}
      width="auto"
      inputValue={inputValue}
      disabled={isReadOnly}
      value={selectedValue}
      noMultiValueWrap={true}
      maxVisibleValues={maxVisibleValues ?? 5}
      tabSelectsValue={false}
      virtualized
      allowCustomValue={allowCustomValue}
      //@ts-ignore
      toggleAllOptions={{
        enabled: true,
        optionsFilter: filterAll,
        determineToggleAllState: determineToggleAllState,
        // Use the full individual list (not search-filtered options) so `$__all` shows Selected (N)
        getSelectedCount: (selectedValues) => {
          const selected = selectedValues.map((v) => v.value as VariableValueSingle);
          if (isAllVariableValue(selected)) {
            return allIndividualValues.length;
          }
          return selected.filter((v) => v !== ALL_VARIABLE_VALUE).length;
        },
      }}
      //@ts-ignore – react-select supports this; grafana-ui MultiSelect types omit it
      isOptionSelected={isOptionSelected}
      options={filteredOptions}
      closeMenuOnSelect={false}
      components={{ Option: OptionWithCheckbox }}
      isClearable={true}
      hideSelectedOptions={false}
      blurInputOnSelect={false}
      onInputChange={onInputChange}
      onBlur={() => {
        const pending = uncommittedValueRef.current;
        if (pending !== undefined) {
          commitValue(pending);
        }
        updateUncommitted(undefined);
      }}
      filterOption={filterNoOp}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${selectedValue}`)}
      onChange={(newValue, action) => {
        if (action.action === 'clear') {
          // Clearing does not leave the input focused, so onBlur may never fire to commit it
          // Clear still uses the default fallback (`$__all` / first option) via changeValueTo
          model.changeValueTo([], undefined, true);
          updateUncommitted(undefined);
          return;
        }

        const optionValue = (action.option as SelectableValue<VariableValueSingle> | undefined)?.value;
        const isAllOptionClick =
          optionValue === ALL_VARIABLE_VALUE &&
          (action.action === 'select-option' || action.action === 'deselect-option');

        // Header toggle when checked emits [All] with an empty option — same as unchecking All
        const isHeaderUncheckAll =
          !optionValue &&
          action.action === 'select-option' &&
          newValue.length === 1 &&
          newValue[0]?.value === ALL_VARIABLE_VALUE;

        // All checkbox: check → select every value; uncheck → clear every value
        if (isAllOptionClick || isHeaderUncheckAll) {
          if (fullySelected || isHeaderUncheckAll) {
            updateUncommitted([], true);
          } else {
            // Store `$__all` (query/URL semantics) while isOptionSelected shows every value checked
            updateUncommitted([ALL_VARIABLE_VALUE]);
          }
          return;
        }

        // Individual click while `$__all` is active: exit All mode
        if (isAllVariableValue(selectedValue) && optionValue !== undefined) {
          if (action.action === 'deselect-option') {
            updateUncommitted(allIndividualValues.filter((v) => v !== optionValue));
          } else if (action.action === 'select-option') {
            updateUncommitted(allIndividualValues);
          }
          return;
        }

        const next = newValue.map((x) => x.value!).filter((v) => v !== ALL_VARIABLE_VALUE);

        // Only collapse to `$__all` when Include All is enabled — otherwise a full
        // selection would be rewritten to the first option after validation/reload
        if (includeAll && isFullySelected(next, allIndividualValues)) {
          updateUncommitted([ALL_VARIABLE_VALUE]);
          return;
        }

        updateUncommitted(next);
      }}
    />
  );
}

interface SelectMenuOptionProps<T> {
  isDisabled: boolean;
  isFocused: boolean;
  isSelected: boolean;
  innerProps: React.JSX.IntrinsicElements['div'];
  innerRef: RefCallback<HTMLDivElement>;
  renderOptionLabel?: (value: SelectableValue<T>) => React.JSX.Element;
  data: SelectableValue<T>;
  indeterminate: boolean;
}

export const OptionWithCheckbox = ({
  children,
  data,
  innerProps,
  innerRef,
  isFocused,
  isSelected,
  indeterminate,
  renderOptionLabel,
}: React.PropsWithChildren<SelectMenuOptionProps<unknown>>) => {
  // We are removing onMouseMove and onMouseOver from innerProps because they cause the whole
  // list to re-render everytime the user hovers over an option. This is a performance issue.
  // See https://github.com/JedWatson/react-select/issues/3128#issuecomment-451936743
  const { onMouseMove, onMouseOver, ...rest } = innerProps;
  const theme = useTheme2();
  const selectStyles = getSelectStyles(theme);
  const optionStyles = useStyles2(getOptionStyles);

  return (
    <div
      ref={innerRef}
      className={cx(selectStyles.option, isFocused && selectStyles.optionFocused)}
      {...rest}
      data-testid={selectors.components.Select.option}
      title={data.title}
      // rest.onClick cannot be set here as it causes double onClick
      onClick={undefined}
      // Using onPointerDown here as onClick is not fired first time for mobile/touch devices
      onPointerDown={rest.onClick}
    >
      <div
        className={optionStyles.checkbox}
        // Keep focus on the select input so clicking the checkbox does not blur+commit mid-toggle
        onMouseDown={(e) => e.preventDefault()}
      >
        <Checkbox indeterminate={indeterminate} value={isSelected} tabIndex={-1} />
      </div>
      <div
        className={selectStyles.optionBody}
        data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownOptionTexts(
          data.label ?? String(data.value)
        )}
      >
        <span>{children}</span>
      </div>
    </div>
  );
};

OptionWithCheckbox.displayName = 'SelectMenuOptions';

const getOptionStyles = (theme: GrafanaTheme2) => ({
  checkbox: css({
    marginRight: theme.spacing(2),
  }),
});

export function MultiOrSingleValueSelect({ model }: { model: MultiValueVariable }) {
  const state = model.useState();

  if (state.isMulti) {
    return <VariableValueSelectMulti model={model} state={state} />;
  } else {
    return <VariableValueSelect model={model} state={state} />;
  }
}
