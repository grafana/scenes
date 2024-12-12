import { isArray } from 'lodash';
import React, { useState, useMemo, useEffect } from 'react';
import { Select, MultiSelect, useTheme2, getSelectStyles, useStyles2, Checkbox, ToggleAllState } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { cx, css } from '@emotion/css';
import { getOptionSearcher } from './getOptionSearcher.js';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const filterNoOp = () => true;
const filterAll = (v) => v.value !== "$__all";
const determineToggleAllState = (selectedValues, options) => {
  if (selectedValues.length === options.filter(filterAll).length) {
    return ToggleAllState.allSelected;
  } else if (selectedValues.length === 0 || selectedValues.length === 1 && selectedValues[0] && selectedValues[0].value === "$__all") {
    return ToggleAllState.noneSelected;
  } else {
    return ToggleAllState.indeterminate;
  }
};
function toSelectableValue(value, label) {
  return {
    value,
    label: label != null ? label : String(value)
  };
}
function VariableValueSelect({ model }) {
  const { value, text, key, options, includeAll, isReadOnly } = model.useState();
  const [inputValue, setInputValue] = useState("");
  const [hasCustomValue, setHasCustomValue] = useState(false);
  const selectValue = toSelectableValue(value, String(text));
  const optionSearcher = useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);
  const onInputChange = (value2, { action }) => {
    if (action === "input-change") {
      setInputValue(value2);
      if (model.onSearchChange) {
        model.onSearchChange(value2);
      }
      return value2;
    }
    return value2;
  };
  const filteredOptions = optionSearcher(inputValue);
  const onOpenMenu = () => {
    if (hasCustomValue) {
      setInputValue(String(text));
    }
  };
  const onCloseMenu = () => {
    setInputValue("");
  };
  return /* @__PURE__ */ React.createElement(Select, {
    id: key,
    isValidNewOption: (inputValue2) => inputValue2.trim().length > 0,
    placeholder: "Select value",
    width: "auto",
    disabled: isReadOnly,
    value: selectValue,
    inputValue,
    allowCustomValue: true,
    virtualized: true,
    filterOption: filterNoOp,
    tabSelectsValue: false,
    onInputChange,
    onOpenMenu,
    onCloseMenu,
    options: filteredOptions,
    "data-testid": selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${value}`),
    onChange: (newValue) => {
      model.changeValueTo(newValue.value, newValue.label);
      if (hasCustomValue !== newValue.__isNew__) {
        setHasCustomValue(newValue.__isNew__);
      }
    }
  });
}
function VariableValueSelectMulti({ model }) {
  const { value, options, key, maxVisibleValues, noValueOnClear, includeAll, isReadOnly } = model.useState();
  const arrayValue = useMemo(() => isArray(value) ? value : [value], [value]);
  const [uncommittedValue, setUncommittedValue] = useState(arrayValue);
  const [inputValue, setInputValue] = useState("");
  const optionSearcher = useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);
  useEffect(() => {
    setUncommittedValue(arrayValue);
  }, [arrayValue]);
  const onInputChange = (value2, { action }) => {
    if (action === "input-change") {
      setInputValue(value2);
      if (model.onSearchChange) {
        model.onSearchChange(value2);
      }
      return value2;
    }
    if (action === "input-blur") {
      setInputValue("");
      return "";
    }
    return inputValue;
  };
  const placeholder = options.length > 0 ? "Select value" : "";
  const filteredOptions = optionSearcher(inputValue);
  return /* @__PURE__ */ React.createElement(MultiSelect, {
    id: key,
    placeholder,
    width: "auto",
    inputValue,
    disabled: isReadOnly,
    value: uncommittedValue,
    noMultiValueWrap: true,
    maxVisibleValues: maxVisibleValues != null ? maxVisibleValues : 5,
    tabSelectsValue: false,
    virtualized: true,
    allowCustomValue: true,
    toggleAllOptions: {
      enabled: true,
      optionsFilter: filterAll,
      determineToggleAllState
    },
    options: filteredOptions,
    closeMenuOnSelect: false,
    components: { Option: OptionWithCheckbox },
    isClearable: true,
    hideSelectedOptions: false,
    onInputChange,
    onBlur: () => {
      model.changeValueTo(uncommittedValue);
    },
    filterOption: filterNoOp,
    "data-testid": selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${uncommittedValue}`),
    onChange: (newValue, action) => {
      if (action.action === "clear" && noValueOnClear) {
        model.changeValueTo([]);
      }
      setUncommittedValue(newValue.map((x) => x.value));
    }
  });
}
const OptionWithCheckbox = ({
  children,
  data,
  innerProps,
  innerRef,
  isFocused,
  isSelected,
  indeterminate,
  renderOptionLabel
}) => {
  var _b;
  const _a = innerProps, rest = __objRest(_a, ["onMouseMove", "onMouseOver"]);
  const theme = useTheme2();
  const selectStyles = getSelectStyles(theme);
  const optionStyles = useStyles2(getOptionStyles);
  return /* @__PURE__ */ React.createElement("div", __spreadProps(__spreadValues({
    ref: innerRef,
    className: cx(selectStyles.option, isFocused && selectStyles.optionFocused)
  }, rest), {
    "data-testid": "data-testid Select option",
    title: data.title
  }), /* @__PURE__ */ React.createElement("div", {
    className: optionStyles.checkbox
  }, /* @__PURE__ */ React.createElement(Checkbox, {
    indeterminate,
    value: isSelected
  })), /* @__PURE__ */ React.createElement("div", {
    className: selectStyles.optionBody,
    "data-testid": selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownOptionTexts(
      (_b = data.label) != null ? _b : String(data.value)
    )
  }, /* @__PURE__ */ React.createElement("span", null, children)));
};
OptionWithCheckbox.displayName = "SelectMenuOptions";
const getOptionStyles = (theme) => ({
  checkbox: css({
    marginRight: theme.spacing(2)
  })
});
function renderSelectForVariable(model) {
  if (model.state.isMulti) {
    return /* @__PURE__ */ React.createElement(VariableValueSelectMulti, {
      model
    });
  } else {
    return /* @__PURE__ */ React.createElement(VariableValueSelect, {
      model
    });
  }
}

export { OptionWithCheckbox, VariableValueSelect, VariableValueSelectMulti, renderSelectForVariable, toSelectableValue };
//# sourceMappingURL=VariableValueSelect.js.map
