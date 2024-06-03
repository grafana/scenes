import { isArray } from 'lodash';
import React, { RefCallback, useEffect, useMemo, useState } from 'react';

import { Checkbox, InputActionMeta, MultiSelect, Select, getSelectStyles, useStyles2, useTheme2 } from '@grafana/ui';

import { SceneComponentProps } from '../../core/types';
import { MultiValueVariable } from '../variants/MultiValueVariable';
import { VariableValue, VariableValueSingle } from '../types';
import { selectors } from '@grafana/e2e-selectors';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { getOptionSearcher } from './getOptionSearcher';

const filterNoOp = () => true;

export function VariableValueSelect({ model }: SceneComponentProps<MultiValueVariable>) {
  const { value, text, key, options, includeAll } = model.useState();
  const [inputValue, setInputValue] = useState('');
  const optionSearcher = useMemo(
    () => getOptionSearcher(options, includeAll, value, text),
    [options, includeAll, value, text]
  );

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

  return (
    <Select<VariableValue>
      id={key}
      placeholder="Select value"
      width="auto"
      value={value}
      allowCustomValue
      virtualized
      filterOption={filterNoOp}
      tabSelectsValue={false}
      onInputChange={onInputChange}
      options={filteredOptions}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${value}`)}
      onChange={(newValue) => {
        model.changeValueTo(newValue.value!, newValue.label!);
      }}
    />
  );
}

export function VariableValueSelectMulti({ model }: SceneComponentProps<MultiValueVariable>) {
  const { value, text, options, key, maxVisibleValues, noValueOnClear, includeAll } = model.useState();
  const arrayValue = useMemo(() => (isArray(value) ? value : [value]), [value]);
  // To not trigger queries on every selection we store this state locally here and only update the variable onBlur
  const [uncommittedValue, setUncommittedValue] = useState(arrayValue);
  const [inputValue, setInputValue] = useState('');

  const optionSearcher = useMemo(
    () => getOptionSearcher(options, includeAll, value, text),
    [options, includeAll, value, text]
  );

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
      value={uncommittedValue}
      noMultiValueWrap={true}
      maxVisibleValues={maxVisibleValues ?? 5}
      tabSelectsValue={false}
      virtualized
      allowCustomValue
      options={filteredOptions}
      closeMenuOnSelect={false}
      components={{ Option: OptionWithCheckbox }}
      isClearable={true}
      hideSelectedOptions={false}
      onInputChange={onInputChange}
      onBlur={() => {
        model.changeValueTo(uncommittedValue);
      }}
      filterOption={filterNoOp}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${uncommittedValue}`)}
      onChange={(newValue, action) => {
        if (action.action === 'clear' && noValueOnClear) {
          model.changeValueTo([]);
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
}

export const OptionWithCheckbox = ({
  children,
  data,
  innerProps,
  innerRef,
  isFocused,
  isSelected,
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
      aria-label="Select option"
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownOptionTexts(
        data.label || String(data.value)
      )}
      title={data.title}
    >
      <div className={optionStyles.checkbox}>
        <Checkbox value={isSelected} />
      </div>
      <div className={selectStyles.optionBody}>
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

export function renderSelectForVariable(model: MultiValueVariable) {
  if (model.state.isMulti) {
    return <VariableValueSelectMulti model={model} />;
  } else {
    return <VariableValueSelect model={model} />;
  }
}
