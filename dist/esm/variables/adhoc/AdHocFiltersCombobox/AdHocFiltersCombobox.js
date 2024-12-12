import React, { forwardRef, useState, useRef, useId, useMemo, useCallback, useImperativeHandle, useEffect, useLayoutEffect } from 'react';
import { FloatingPortal, FloatingFocusManager } from '@floating-ui/react';
import { useStyles2, Spinner, Text, Button, Icon } from '@grafana/ui';
import { cx, css } from '@emotion/css';
import { isMultiValueOperator } from '../AdHocFiltersVariable.js';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LoadingOptionsPlaceholder, OptionsErrorPlaceholder, NoOptionsPlaceholder, DropdownItem, MultiValueApplyButton } from './DropdownItem.js';
import { fuzzySearchOptions, flattenOptionGroups, setupDropdownAccessibility, VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION, VIRTUAL_LIST_ITEM_HEIGHT, VIRTUAL_LIST_OVERSCAN, generateFilterUpdatePayload, switchToNextInputType, switchInputType, generatePlaceholder, ERROR_STATE_DROPDOWN_WIDTH } from './utils.js';
import { handleOptionGroups } from '../../utils.js';
import { useFloatingInteractions, MAX_MENU_HEIGHT } from './useFloatingInteractions.js';

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
const AdHocCombobox = forwardRef(function AdHocCombobox2({ filter, model, isAlwaysWip, handleChangeViewMode }, parentRef) {
  var _a, _b, _c;
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const [filterInputType, setInputType] = useState(!isAlwaysWip ? "value" : "key");
  const styles = useStyles2(getStyles);
  const [filterMultiValues, setFilterMultiValues] = useState([]);
  const [_, setForceRefresh] = useState({});
  const multiValuePillWrapperRef = useRef(null);
  const hasMultiValueOperator = isMultiValueOperator((filter == null ? void 0 : filter.operator) || "");
  const isMultiValueEdit = hasMultiValueOperator && filterInputType === "value";
  const operatorIdentifier = useId();
  const listRef = useRef([]);
  const disabledIndicesRef = useRef([]);
  const optionsSearcher = useMemo(() => fuzzySearchOptions(options), [options]);
  const handleResetWip = useCallback(() => {
    if (isAlwaysWip) {
      model._addWip();
      setInputType("key");
      setInputValue("");
    }
  }, [model, isAlwaysWip]);
  const handleMultiValueFilterCommit = useCallback(
    (model2, filter2, filterMultiValues2, preventFocus) => {
      if (filterMultiValues2.length) {
        const valueLabels = [];
        const values = [];
        filterMultiValues2.forEach((item) => {
          var _a2;
          valueLabels.push((_a2 = item.label) != null ? _a2 : item.value);
          values.push(item.value);
        });
        model2._updateFilter(filter2, { valueLabels, values, value: values[0] });
        setFilterMultiValues([]);
      }
      if (!preventFocus) {
        setTimeout(() => {
          var _a2;
          return (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
        });
      }
    },
    []
  );
  const handleLocalMultiValueChange = useCallback((selectedItem) => {
    setFilterMultiValues((items) => {
      if (items.some((item) => item.value === selectedItem.value)) {
        return items.filter((item) => item.value !== selectedItem.value);
      }
      return [...items, selectedItem];
    });
  }, []);
  const onOpenChange = useCallback(
    (nextOpen, _2, reason) => {
      setOpen(nextOpen);
      if (reason && ["outside-press", "escape-key"].includes(reason)) {
        if (isMultiValueEdit) {
          handleMultiValueFilterCommit(model, filter, filterMultiValues);
        }
        handleResetWip();
        handleChangeViewMode == null ? void 0 : handleChangeViewMode();
      }
    },
    [
      filter,
      filterMultiValues,
      handleChangeViewMode,
      handleMultiValueFilterCommit,
      handleResetWip,
      isMultiValueEdit,
      model
    ]
  );
  const outsidePressIdsToIgnore = useMemo(() => {
    return [operatorIdentifier, ...filterMultiValues.map((item, i) => `${item.value}-${i}`)];
  }, [operatorIdentifier, filterMultiValues]);
  const { refs, floatingStyles, context, getReferenceProps, getFloatingProps, getItemProps } = useFloatingInteractions({
    open,
    onOpenChange,
    activeIndex,
    setActiveIndex,
    outsidePressIdsToIgnore,
    listRef,
    disabledIndicesRef
  });
  useImperativeHandle(parentRef, () => () => {
    var _a2;
    return (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
  }, [refs.domReference]);
  function onChange(event) {
    const value = event.target.value;
    setInputValue(value);
    setActiveIndex(0);
  }
  const handleRemoveMultiValue = useCallback(
    (item) => {
      setFilterMultiValues((selected) => selected.filter((option) => option.value !== item.value));
      setTimeout(() => {
        var _a2;
        return (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
      });
    },
    [refs.domReference]
  );
  const filteredDropDownItems = flattenOptionGroups(handleOptionGroups(optionsSearcher(inputValue, filterInputType)));
  if (filterInputType !== "operator" && inputValue) {
    filteredDropDownItems.push({
      value: inputValue.trim(),
      label: inputValue.trim(),
      isCustom: true
    });
  }
  const maxOptionWidth = setupDropdownAccessibility(filteredDropDownItems, listRef, disabledIndicesRef);
  const handleFetchOptions = useCallback(
    async (inputType) => {
      var _a2;
      setOptionsError(false);
      setOptionsLoading(true);
      setOptions([]);
      let options2 = [];
      try {
        if (inputType === "key") {
          options2 = await model._getKeys(null);
        } else if (inputType === "operator") {
          options2 = model._getOperators();
        } else if (inputType === "value") {
          options2 = await model._getValuesFor(filter);
        }
        setOptions(options2);
        if ((_a2 = options2[0]) == null ? void 0 : _a2.group) {
          setActiveIndex(1);
        }
      } catch (e) {
        setOptionsError(true);
      }
      setOptionsLoading(false);
    },
    [filter, model]
  );
  const rowVirtualizer = useVirtualizer({
    count: filteredDropDownItems.length,
    getScrollElement: () => refs.floating.current,
    estimateSize: (index) => filteredDropDownItems[index].description ? VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION : VIRTUAL_LIST_ITEM_HEIGHT,
    overscan: VIRTUAL_LIST_OVERSCAN
  });
  const handleBackspaceInput = useCallback(
    (event, multiValueEdit) => {
      if (event.key === "Backspace" && !inputValue) {
        if (multiValueEdit) {
          setFilterMultiValues((items) => {
            const updated = [...items];
            updated.splice(-1, 1);
            return updated;
          });
        } else if (filterInputType === "key") {
          model._removeLastFilter();
          handleFetchOptions(filterInputType);
        }
      }
    },
    [inputValue, filterInputType, model, handleFetchOptions]
  );
  const handleTabInput = useCallback(
    (event, multiValueEdit) => {
      var _a2;
      if (event.key === "Tab" && !event.shiftKey) {
        if (multiValueEdit) {
          event.preventDefault();
          handleMultiValueFilterCommit(model, filter, filterMultiValues);
          (_a2 = refs.domReference.current) == null ? void 0 : _a2.focus();
        }
        handleChangeViewMode == null ? void 0 : handleChangeViewMode();
        handleResetWip();
      }
    },
    [
      filter,
      filterMultiValues,
      handleChangeViewMode,
      handleMultiValueFilterCommit,
      handleResetWip,
      model,
      refs.domReference
    ]
  );
  const handleShiftTabInput = useCallback(
    (event, multiValueEdit) => {
      if (event.key === "Tab" && event.shiftKey) {
        if (multiValueEdit) {
          event.preventDefault();
          handleMultiValueFilterCommit(model, filter, filterMultiValues, true);
        }
        handleChangeViewMode == null ? void 0 : handleChangeViewMode();
        handleResetWip();
      }
    },
    [filter, filterMultiValues, handleChangeViewMode, handleMultiValueFilterCommit, handleResetWip, model]
  );
  const handleEnterInput = useCallback(
    (event, multiValueEdit) => {
      if (event.key === "Enter" && activeIndex != null) {
        if (!filteredDropDownItems[activeIndex]) {
          return;
        }
        const selectedItem = filteredDropDownItems[activeIndex];
        if (multiValueEdit) {
          handleLocalMultiValueChange(selectedItem);
        } else {
          model._updateFilter(
            filter,
            generateFilterUpdatePayload({
              filterInputType,
              item: selectedItem,
              filter,
              setFilterMultiValues
            })
          );
          switchToNextInputType(filterInputType, setInputType, handleChangeViewMode, refs.domReference.current);
          setActiveIndex(0);
        }
        setInputValue("");
      }
    },
    [
      activeIndex,
      filter,
      filterInputType,
      filteredDropDownItems,
      handleLocalMultiValueChange,
      handleChangeViewMode,
      model,
      refs.domReference
    ]
  );
  useEffect(() => {
    if (open) {
      handleFetchOptions(filterInputType);
    }
  }, [open, filterInputType]);
  useEffect(() => {
    var _a2, _b2;
    if (!isAlwaysWip) {
      setInputType("value");
      setInputValue("");
      if (hasMultiValueOperator && ((_a2 = filter == null ? void 0 : filter.values) == null ? void 0 : _a2.length)) {
        const multiValueOptions = filter.values.reduce(
          (acc, value, i) => {
            var _a3;
            return [
              ...acc,
              {
                label: ((_a3 = filter.valueLabels) == null ? void 0 : _a3[i]) || value,
                value
              }
            ];
          },
          []
        );
        setFilterMultiValues(multiValueOptions);
      }
      (_b2 = refs.domReference.current) == null ? void 0 : _b2.focus();
    }
  }, []);
  useEffect(() => {
    if (isMultiValueEdit && filterMultiValues) {
      setTimeout(() => setForceRefresh({}));
    }
  }, [filterMultiValues, isMultiValueEdit]);
  useLayoutEffect(() => {
    var _a2, _b2;
    if (activeIndex !== null && rowVirtualizer.range && (activeIndex > ((_a2 = rowVirtualizer.range) == null ? void 0 : _a2.endIndex) || activeIndex < ((_b2 = rowVirtualizer.range) == null ? void 0 : _b2.startIndex))) {
      rowVirtualizer.scrollToIndex(activeIndex);
    }
  }, [activeIndex, rowVirtualizer]);
  const keyLabel = (_a = filter == null ? void 0 : filter.keyLabel) != null ? _a : filter == null ? void 0 : filter.key;
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.comboboxWrapper
  }, filter ? /* @__PURE__ */ React.createElement("div", {
    className: styles.pillWrapper
  }, (filter == null ? void 0 : filter.key) ? /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.basePill, styles.keyPill)
  }, keyLabel) : null, (filter == null ? void 0 : filter.key) && (filter == null ? void 0 : filter.operator) && filterInputType !== "operator" ? /* @__PURE__ */ React.createElement("div", {
    id: operatorIdentifier,
    className: cx(styles.basePill, styles.operatorPill, operatorIdentifier),
    role: "button",
    "aria-label": "Edit filter operator",
    tabIndex: 0,
    onClick: (event) => {
      event.stopPropagation();
      switchInputType("operator", setInputType, void 0, refs.domReference.current);
    },
    onKeyDown: (event) => {
      handleShiftTabInput(event, hasMultiValueOperator);
      if (event.key === "Enter") {
        switchInputType("operator", setInputType, void 0, refs.domReference.current);
      }
    }
  }, filter.operator) : null, /* @__PURE__ */ React.createElement("div", {
    ref: multiValuePillWrapperRef
  }), isMultiValueEdit ? filterMultiValues.map((item, i) => /* @__PURE__ */ React.createElement(MultiValuePill, {
    key: `${item.value}-${i}`,
    item,
    index: i,
    handleRemoveMultiValue
  })) : null) : null, /* @__PURE__ */ React.createElement("input", __spreadProps(__spreadValues({}, getReferenceProps({
    ref: refs.setReference,
    onChange,
    value: inputValue,
    placeholder: generatePlaceholder(filter, filterInputType, isMultiValueEdit, isAlwaysWip),
    "aria-autocomplete": "list",
    onKeyDown(event) {
      if (!open) {
        setOpen(true);
        return;
      }
      if (filterInputType === "operator") {
        handleShiftTabInput(event);
      }
      handleBackspaceInput(event, isMultiValueEdit);
      handleTabInput(event, isMultiValueEdit);
      handleEnterInput(event, isMultiValueEdit);
    }
  })), {
    className: cx(styles.inputStyle, { [styles.loadingInputPadding]: !optionsLoading }),
    onClick: (event) => {
      event.stopPropagation();
      setOpen(true);
    },
    onFocus: () => {
      setActiveIndex(0);
      setOpen(true);
    }
  })), optionsLoading ? /* @__PURE__ */ React.createElement(Spinner, {
    className: styles.loadingIndicator,
    inline: true
  }) : null, /* @__PURE__ */ React.createElement(FloatingPortal, null, open && /* @__PURE__ */ React.createElement(FloatingFocusManager, {
    context,
    initialFocus: -1,
    visuallyHiddenDismiss: true,
    modal: false
  }, /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", {
    style: __spreadProps(__spreadValues({}, floatingStyles), {
      width: `${optionsError ? ERROR_STATE_DROPDOWN_WIDTH : maxOptionWidth}px`,
      transform: isMultiValueEdit ? `translate(${((_b = multiValuePillWrapperRef.current) == null ? void 0 : _b.getBoundingClientRect().left) || 0}px, ${(((_c = refs.domReference.current) == null ? void 0 : _c.getBoundingClientRect().bottom) || 0) + 10}px )` : floatingStyles.transform
    }),
    ref: refs.setFloating,
    className: styles.dropdownWrapper,
    tabIndex: -1
  }, /* @__PURE__ */ React.createElement("div", __spreadProps(__spreadValues({
    style: {
      height: `${rowVirtualizer.getTotalSize() || VIRTUAL_LIST_ITEM_HEIGHT}px`
    }
  }, getFloatingProps()), {
    tabIndex: -1
  }), optionsLoading ? /* @__PURE__ */ React.createElement(LoadingOptionsPlaceholder, null) : optionsError ? /* @__PURE__ */ React.createElement(OptionsErrorPlaceholder, {
    handleFetchOptions: () => handleFetchOptions(filterInputType)
  }) : !filteredDropDownItems.length && (filterInputType === "operator" || !inputValue) ? /* @__PURE__ */ React.createElement(NoOptionsPlaceholder, null) : rowVirtualizer.getVirtualItems().map((virtualItem) => {
    var _a2;
    const item = filteredDropDownItems[virtualItem.index];
    const index = virtualItem.index;
    if (item.options) {
      return /* @__PURE__ */ React.createElement("div", {
        key: `${item.label}+${index}`,
        className: cx(styles.optionGroupLabel, styles.groupTopBorder),
        style: {
          height: `${virtualItem.size}px`,
          transform: `translateY(${virtualItem.start}px)`
        }
      }, /* @__PURE__ */ React.createElement(Text, {
        weight: "bold",
        variant: "bodySmall",
        color: "secondary"
      }, item.label));
    }
    const nextItem = filteredDropDownItems[virtualItem.index + 1];
    const shouldAddBottomBorder = nextItem && !nextItem.group && !nextItem.options && item.group;
    return /* @__PURE__ */ React.createElement(DropdownItem, __spreadProps(__spreadValues({}, getItemProps({
      key: `${item.value}-${index}`,
      ref(node) {
        listRef.current[index] = node;
      },
      onClick(event) {
        var _a3;
        if (filterInputType !== "value") {
          event.stopPropagation();
        }
        if (isMultiValueEdit) {
          event.preventDefault();
          event.stopPropagation();
          handleLocalMultiValueChange(item);
          (_a3 = refs.domReference.current) == null ? void 0 : _a3.focus();
        } else {
          model._updateFilter(
            filter,
            generateFilterUpdatePayload({
              filterInputType,
              item,
              filter,
              setFilterMultiValues
            })
          );
          setInputValue("");
          switchToNextInputType(
            filterInputType,
            setInputType,
            handleChangeViewMode,
            refs.domReference.current
          );
        }
      }
    })), {
      active: activeIndex === index,
      addGroupBottomBorder: shouldAddBottomBorder,
      style: {
        height: `${virtualItem.size}px`,
        transform: `translateY(${virtualItem.start}px)`
      },
      "aria-setsize": filteredDropDownItems.length,
      "aria-posinset": virtualItem.index + 1,
      isMultiValueEdit,
      checked: filterMultiValues.some((val) => val.value === item.value)
    }), /* @__PURE__ */ React.createElement("span", null, item.isCustom ? "Use custom value: " : "", " ", (_a2 = item.label) != null ? _a2 : item.value), item.description ? /* @__PURE__ */ React.createElement("div", {
      className: styles.descriptionText
    }, item.description) : null);
  }))), isMultiValueEdit && !optionsLoading && !optionsError && filteredDropDownItems.length ? /* @__PURE__ */ React.createElement(MultiValueApplyButton, {
    onApply: () => {
      handleMultiValueFilterCommit(model, filter, filterMultiValues);
    },
    floatingElement: refs.floating.current,
    maxOptionWidth,
    menuHeight: Math.min(rowVirtualizer.getTotalSize(), MAX_MENU_HEIGHT)
  }) : null))));
});
const MultiValuePill = ({ item, handleRemoveMultiValue, index }) => {
  var _a, _b;
  const styles = useStyles2(getStyles);
  return /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.basePill, styles.valuePill)
  }, /* @__PURE__ */ React.createElement("span", null, " ", (_a = item.label) != null ? _a : item.value), /* @__PURE__ */ React.createElement(Button, {
    onClick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleRemoveMultiValue(item);
    },
    onKeyDownCapture: (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleRemoveMultiValue(item);
      }
    },
    fill: "text",
    size: "sm",
    variant: "secondary",
    className: styles.removeButton,
    tooltip: `Remove filter value - ${(_b = item.label) != null ? _b : item.value}`
  }, /* @__PURE__ */ React.createElement(Icon, {
    name: "times",
    size: "md",
    id: `${item.value}-${index}`
  })));
};
const getStyles = (theme) => ({
  comboboxWrapper: css({
    display: "flex",
    flexWrap: "wrap"
  }),
  pillWrapper: css({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap"
  }),
  basePill: css(__spreadProps(__spreadValues({
    display: "flex",
    alignItems: "center",
    background: theme.colors.action.disabledBackground,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 1, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: "hidden",
    whiteSpace: "nowrap",
    minHeight: theme.spacing(2.75)
  }, theme.typography.bodySmall), {
    cursor: "pointer"
  })),
  keyPill: css({
    fontWeight: theme.typography.fontWeightBold,
    cursor: "default"
  }),
  operatorPill: css({
    "&:hover": {
      background: theme.colors.action.hover
    }
  }),
  valuePill: css({
    background: theme.colors.action.selected,
    padding: theme.spacing(0.125, 0, 0.125, 1)
  }),
  dropdownWrapper: css({
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.z2,
    overflowY: "auto",
    zIndex: theme.zIndex.dropdown
  }),
  inputStyle: css({
    paddingBlock: 0,
    "&:focus": {
      outline: "none"
    }
  }),
  loadingIndicator: css({
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing(0.5)
  }),
  loadingInputPadding: css({
    paddingRight: theme.spacing(2.5)
  }),
  optionGroupLabel: css({
    padding: theme.spacing(1),
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%"
  }),
  groupTopBorder: css({
    "&:not(:first-child)": {
      borderTop: `1px solid ${theme.colors.border.weak}`
    }
  }),
  removeButton: css({
    marginInline: theme.spacing(0.5),
    height: "100%",
    padding: 0,
    cursor: "pointer",
    "&:hover": {
      color: theme.colors.text.primary
    }
  }),
  descriptionText: css(__spreadProps(__spreadValues({}, theme.typography.bodySmall), {
    color: theme.colors.text.secondary,
    paddingTop: theme.spacing(0.5)
  })),
  multiValueApply: css({
    position: "absolute",
    top: 0,
    left: 0,
    display: "flex"
  })
});

export { AdHocCombobox };
//# sourceMappingURL=AdHocFiltersCombobox.js.map
