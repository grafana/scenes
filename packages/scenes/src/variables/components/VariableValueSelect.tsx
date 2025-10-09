import { t } from '@grafana/i18n';
import { isArray } from 'lodash';
import React, { RefCallback, useEffect, useMemo, useState } from 'react';
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
import { VariableValue, VariableValueSingle } from '../types';
import { selectors } from '@grafana/e2e-selectors';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { getOptionSearcher } from './getOptionSearcher';
import { sceneGraph } from '../../core/sceneGraph';
import { VARIABLE_VALUE_CHANGED_INTERACTION } from '../../behaviors/interactionConstants';

const filterNoOp = () => true;

const filterAll = (v: SelectableValue<VariableValueSingle>) => v.value !== '$__all';

const determineToggleAllState = (
  selectedValues: Array<SelectableValue<VariableValueSingle>>,
  options: Array<SelectableValue<VariableValueSingle>>
) => {
  if (selectedValues.length === options.filter(filterAll).length) {
    return ToggleAllState.allSelected;
  } else if (
    selectedValues.length === 0 ||
    (selectedValues.length === 1 && selectedValues[0] && selectedValues[0].value === '$__all')
  ) {
    return ToggleAllState.noneSelected;
  } else {
    return ToggleAllState.indeterminate;
  }
};

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
  const selectValue = toSelectableValue(value, String(text));
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
        model.changeValueTo(newValue.value!, newValue.label!, true);
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
  const {
    value,
    options,
    key,
    maxVisibleValues,
    noValueOnClear,
    includeAll,
    isReadOnly,
    allowCustomValue = true,
  } = state;
  const arrayValue = useMemo(() => (isArray(value) ? value : [value]), [value]);
  // To not trigger queries on every selection we store this state locally here and only update the variable onBlur
  const [uncommittedValue, setUncommittedValue] = useState(arrayValue);
  const [inputValue, setInputValue] = useState('');

  const optionSearcher = useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);

  // Detect value changes outside
  useEffect(() => {
    setUncommittedValue(arrayValue);
  }, [arrayValue]);

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

  const placeholder = options.length > 0 ? 'Select value' : '';
  const filteredOptions = optionSearcher(inputValue);

  return (
    <MultiSelect<VariableValueSingle>
      id={key}
      placeholder={placeholder}
      width="auto"
      inputValue={inputValue}
      disabled={isReadOnly}
      value={uncommittedValue}
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
      }}
      options={filteredOptions}
      closeMenuOnSelect={false}
      components={{ Option: OptionWithCheckbox }}
      isClearable={true}
      hideSelectedOptions={false}
      onInputChange={onInputChange}
      onBlur={() => {
        model.changeValueTo(uncommittedValue, undefined, true);
      }}
      filterOption={filterNoOp}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${uncommittedValue}`)}
      onChange={(newValue, action) => {
        if (action.action === 'clear' && noValueOnClear) {
          model.changeValueTo([], undefined, true);
        }
        setUncommittedValue(newValue.map((x) => x.value!));
      }}
    />
  );
}

interface SelectMenuOptionProps<T> {
  isDisabled: boolean;
  isFocused: boolean;
  isSelected: boolean;
  innerProps: JSX.IntrinsicElements['div'];
  innerRef: RefCallback<HTMLDivElement>;
  renderOptionLabel?: (value: SelectableValue<T>) => JSX.Element;
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
      // TODO: use below selector once we update grafana dependencies to ^11.1.0
      // data-testid={selectors.components.Select.option}
      data-testid="data-testid Select option"
      title={data.title}
    >
      <div className={optionStyles.checkbox}>
        <Checkbox indeterminate={indeterminate} value={isSelected} />
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
