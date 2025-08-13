import React, { useState, useMemo } from 'react';
import { isMultiValueOperator } from './AdHocFiltersVariable.js';
import { useStyles2, Select, Field, Button } from '@grafana/ui';
import { cx, css } from '@emotion/css';
import { ControlsLabel } from '../../utils/ControlsLabel.js';
import { getAdhocOptionSearcher } from './getAdhocOptionSearcher.js';
import { handleOptionGroups } from '../utils.js';
import { OptionWithCheckbox } from '../components/VariableValueSelect.js';

var __defProp = Object.defineProperty;
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
function keyLabelToOption(key, label) {
  return key !== "" ? {
    value: key,
    label: label || key
  } : null;
}
const filterNoOp = () => true;
function AdHocFilterRenderer({ filter, model }) {
  var _a, _b, _c, _d, _e;
  const styles = useStyles2(getStyles);
  const [keys, setKeys] = useState([]);
  const [values, setValues] = useState([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [isValuesLoading, setIsValuesLoading] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [isValuesOpen, setIsValuesOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const [valueInputValue, setValueInputValue] = useState("");
  const [valueHasCustomValue, setValueHasCustomValue] = useState(false);
  const [uncommittedValue, setUncommittedValue] = useState(
    filter.values ? filter.values.map((value, index) => {
      var _a2;
      return keyLabelToOption(value, (_a2 = filter.valueLabels) == null ? void 0 : _a2[index]);
    }) : []
  );
  const isMultiValue = isMultiValueOperator(filter.operator);
  const keyValue = keyLabelToOption(filter.key, filter.keyLabel);
  const valueValue = keyLabelToOption(filter.value, (_a = filter.valueLabels) == null ? void 0 : _a[0]);
  const optionSearcher = useMemo(() => getAdhocOptionSearcher(values), [values]);
  const onValueInputChange = (value, { action }) => {
    if (action === "input-change") {
      setValueInputValue(value);
    }
    return value;
  };
  const onOperatorChange = (v) => {
    var _a2, _b2;
    const existingOperator = filter.operator;
    const newOperator = v.value;
    const update = { operator: newOperator };
    if (isMultiValueOperator(existingOperator) && !isMultiValueOperator(newOperator)) {
      update.value = "";
      update.valueLabels = [""];
      update.values = void 0;
      setUncommittedValue([]);
    } else if (!isMultiValueOperator(existingOperator) && isMultiValueOperator(newOperator) && filter.value) {
      update.values = [filter.value];
      setUncommittedValue([
        {
          value: filter.value,
          label: (_b2 = (_a2 = filter.valueLabels) == null ? void 0 : _a2[0]) != null ? _b2 : filter.value
        }
      ]);
    }
    model._updateFilter(filter, update);
  };
  const filteredValueOptions = useMemo(
    () => handleOptionGroups(optionSearcher(valueInputValue)),
    [optionSearcher, valueInputValue]
  );
  const multiValueProps = {
    isMulti: true,
    value: uncommittedValue,
    components: {
      Option: OptionWithCheckbox
    },
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    openMenuOnFocus: false,
    onChange: (v) => {
      setUncommittedValue(v);
      if (v.some((value) => value.__isNew__)) {
        setValueInputValue("");
      }
    },
    onBlur: () => {
      var _a2, _b2;
      model._updateFilter(filter, {
        value: (_b2 = (_a2 = uncommittedValue[0]) == null ? void 0 : _a2.value) != null ? _b2 : "",
        values: uncommittedValue.map((option) => option.value),
        valueLabels: uncommittedValue.map((option) => option.label)
      });
    }
  };
  const valueSelect = /* @__PURE__ */ React.createElement(Select, __spreadValues({
    virtualized: true,
    allowCustomValue: (_b = model.state.allowCustomValue) != null ? _b : true,
    isValidNewOption: (inputValue) => inputValue.trim().length > 0,
    allowCreateWhileLoading: true,
    createOptionPosition: "first",
    formatCreateLabel: (inputValue) => `Use custom value: ${inputValue}`,
    disabled: model.state.readOnly,
    className: cx(styles.value, isValuesOpen ? styles.widthWhenOpen : void 0),
    width: "auto",
    value: valueValue,
    filterOption: filterNoOp,
    placeholder: "Select value",
    options: filteredValueOptions,
    inputValue: valueInputValue,
    onInputChange: onValueInputChange,
    onChange: (v) => {
      model._updateFilter(filter, {
        value: v.value,
        valueLabels: v.label ? [v.label] : [v.value]
      });
      if (valueHasCustomValue !== v.__isNew__) {
        setValueHasCustomValue(v.__isNew__);
      }
    },
    isOpen: isValuesOpen && !isValuesLoading,
    isLoading: isValuesLoading,
    openMenuOnFocus: true,
    onOpenMenu: async () => {
      var _a2;
      setIsValuesLoading(true);
      setIsValuesOpen(true);
      const values2 = await model._getValuesFor(filter);
      setIsValuesLoading(false);
      setValues(values2);
      if (valueHasCustomValue) {
        setValueInputValue((_a2 = valueValue == null ? void 0 : valueValue.label) != null ? _a2 : "");
      }
    },
    onCloseMenu: () => {
      setIsValuesOpen(false);
      setValueInputValue("");
    }
  }, isMultiValue && multiValueProps));
  const keySelect = /* @__PURE__ */ React.createElement(Select, {
    key: `${isValuesLoading ? "loading" : "loaded"}`,
    disabled: model.state.readOnly,
    className: cx(styles.key, isKeysOpen ? styles.widthWhenOpen : void 0),
    width: "auto",
    allowCustomValue: (_c = model.state.allowCustomValue) != null ? _c : true,
    value: keyValue,
    placeholder: "Select label",
    options: handleOptionGroups(keys),
    onChange: (v) => {
      model._updateFilter(filter, {
        key: v.value,
        keyLabel: v.label,
        value: "",
        valueLabels: [""],
        values: void 0
      });
      setUncommittedValue([]);
    },
    autoFocus: filter.key === "",
    isOpen: isKeysOpen && !isKeysLoading,
    isLoading: isKeysLoading,
    onOpenMenu: async () => {
      setIsKeysOpen(true);
      setIsKeysLoading(true);
      const keys2 = await model._getKeys(filter.key);
      setIsKeysLoading(false);
      setKeys(keys2);
    },
    onCloseMenu: () => {
      setIsKeysOpen(false);
    },
    onBlur: () => {
      if (filter.key === "") {
        model._removeFilter(filter);
      }
    },
    openMenuOnFocus: true
  });
  const operatorSelect = /* @__PURE__ */ React.createElement(Select, {
    className: cx(styles.operator, {
      [styles.widthWhenOpen]: isOperatorOpen
    }),
    value: filter.operator,
    disabled: model.state.readOnly,
    options: model._getOperators(),
    onChange: onOperatorChange,
    onOpenMenu: () => {
      setIsOperatorOpen(true);
    },
    onCloseMenu: () => {
      setIsOperatorOpen(false);
    }
  });
  if (model.state.layout === "vertical") {
    if (filter.key) {
      const label = /* @__PURE__ */ React.createElement(ControlsLabel, {
        layout: "vertical",
        label: (_d = filter.key) != null ? _d : "",
        onRemove: () => model._removeFilter(filter)
      });
      return /* @__PURE__ */ React.createElement(Field, {
        label,
        "data-testid": `AdHocFilter-${filter.key}`,
        className: styles.field
      }, /* @__PURE__ */ React.createElement("div", {
        className: styles.wrapper
      }, operatorSelect, valueSelect));
    } else {
      return /* @__PURE__ */ React.createElement(Field, {
        label: "Select label",
        "data-testid": `AdHocFilter-${filter.key}`,
        className: styles.field
      }, keySelect);
    }
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.wrapper,
    "data-testid": `AdHocFilter-${filter.key}`
  }, keySelect, operatorSelect, valueSelect, /* @__PURE__ */ React.createElement(Button, {
    variant: "secondary",
    "aria-label": "Remove filter",
    title: "Remove filter",
    className: styles.removeButton,
    icon: "times",
    "data-testid": `AdHocFilter-remove-${(_e = filter.key) != null ? _e : ""}`,
    onClick: () => model._removeFilter(filter)
  }));
}
const getStyles = (theme) => ({
  field: css({
    marginBottom: 0
  }),
  wrapper: css({
    display: "flex",
    "> *": {
      "&:not(:first-child)": {
        marginLeft: -1
      },
      "&:first-child": {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0
      },
      "&:last-child": {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0
      },
      "&:not(:first-child):not(:last-child)": {
        borderRadius: 0
      },
      position: "relative",
      zIndex: 0,
      "&:hover": {
        zIndex: 1
      },
      "&:focus-within": {
        zIndex: 2
      }
    }
  }),
  widthWhenOpen: css({
    minWidth: theme.spacing(16)
  }),
  value: css({
    flexBasis: "content",
    flexShrink: 1,
    minWidth: "90px"
  }),
  key: css({
    flexBasis: "content",
    minWidth: "90px",
    flexShrink: 1
  }),
  operator: css({
    flexShrink: 0,
    flexBasis: "content"
  }),
  removeButton: css({
    paddingLeft: theme.spacing(3 / 2),
    paddingRight: theme.spacing(3 / 2),
    borderLeft: "none",
    width: theme.spacing(3),
    marginRight: theme.spacing(1),
    boxSizing: "border-box",
    position: "relative",
    left: "1px"
  })
});

export { AdHocFilterRenderer };
//# sourceMappingURL=AdHocFilterRenderer.js.map
