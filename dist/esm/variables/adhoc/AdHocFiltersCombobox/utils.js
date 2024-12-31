import { isMultiValueOperator } from '../AdHocFiltersVariable.js';
import { getFuzzySearcher } from '../../utils.js';

const VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER = 8;
const VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER = 6;
const VIRTUAL_LIST_PADDING = 8;
const VIRTUAL_LIST_OVERSCAN = 5;
const VIRTUAL_LIST_ITEM_HEIGHT = 38;
const VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION = 60;
const ERROR_STATE_DROPDOWN_WIDTH = 366;
function fuzzySearchOptions(options) {
  const haystack = options.map((o) => {
    var _a;
    return (_a = o.label) != null ? _a : o.value;
  });
  const fuzzySearch = getFuzzySearcher(haystack);
  return (search, filterInputType) => {
    if (filterInputType === "operator" && search !== "") {
      search = `"${search}"`;
    }
    return fuzzySearch(search).map((i) => options[i]);
  };
}
const flattenOptionGroups = (options) => options.flatMap((option) => option.options ? [option, ...option.options] : [option]);
const setupDropdownAccessibility = (options, listRef, disabledIndicesRef) => {
  var _a, _b, _c, _d;
  let maxOptionWidth = 182;
  const listRefArr = [];
  const disabledIndices = [];
  for (let i = 0; i < options.length; i++) {
    listRefArr.push(null);
    if ((_a = options[i]) == null ? void 0 : _a.options) {
      disabledIndices.push(i);
    }
    let label = (_c = (_b = options[i].label) != null ? _b : options[i].value) != null ? _c : "";
    let multiplierToUse = VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER;
    if (label.length * VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER < (((_d = options[i].description) == null ? void 0 : _d.length) || 0) * VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER) {
      label = options[i].description;
      multiplierToUse = VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER;
    }
    const widthEstimate = (options[i].isCustom ? label.length + 18 : label.length) * multiplierToUse + VIRTUAL_LIST_PADDING * 2;
    if (widthEstimate > maxOptionWidth) {
      maxOptionWidth = widthEstimate;
    }
  }
  listRef.current = [...listRefArr];
  disabledIndicesRef.current = [...disabledIndices];
  return maxOptionWidth;
};
const nextInputTypeMap = {
  key: "operator",
  operator: "value",
  value: "key"
};
const switchToNextInputType = (filterInputType, setInputType, handleChangeViewMode, element, shouldFocusOnPillWrapperOverride) => switchInputType(
  nextInputTypeMap[filterInputType],
  setInputType,
  filterInputType === "value" ? handleChangeViewMode : void 0,
  element,
  shouldFocusOnPillWrapperOverride
);
const switchInputType = (filterInputType, setInputType, handleChangeViewMode, element, shouldFocusOnPillWrapperOverride) => {
  setInputType(filterInputType);
  handleChangeViewMode == null ? void 0 : handleChangeViewMode(void 0, shouldFocusOnPillWrapperOverride);
  setTimeout(() => element == null ? void 0 : element.focus());
};
const generateFilterUpdatePayload = ({
  filterInputType,
  item,
  filter,
  setFilterMultiValues
}) => {
  var _a, _b, _c, _d, _e;
  if (filterInputType === "key") {
    return {
      key: item.value,
      keyLabel: item.label ? item.label : item.value
    };
  }
  if (filterInputType === "value") {
    return {
      value: item.value,
      valueLabels: [item.label ? item.label : item.value]
    };
  }
  if (filterInputType === "operator") {
    if (isMultiValueOperator(filter.operator) && !isMultiValueOperator(item.value)) {
      setFilterMultiValues([]);
      return {
        operator: item.value,
        valueLabels: [((_a = filter.valueLabels) == null ? void 0 : _a[0]) || ((_b = filter.values) == null ? void 0 : _b[0]) || filter.value],
        values: void 0
      };
    }
    if (isMultiValueOperator(item.value) && !isMultiValueOperator(filter.operator)) {
      const valueLabels = [((_c = filter.valueLabels) == null ? void 0 : _c[0]) || ((_d = filter.values) == null ? void 0 : _d[0]) || filter.value];
      const values = [filter.value];
      if (values[0]) {
        setFilterMultiValues([
          {
            value: values[0],
            label: (_e = valueLabels == null ? void 0 : valueLabels[0]) != null ? _e : values[0]
          }
        ]);
      }
      return {
        operator: item.value,
        valueLabels,
        values
      };
    }
  }
  return {
    [filterInputType]: item.value
  };
};
const INPUT_PLACEHOLDER = "Filter by label values";
const generatePlaceholder = (filter, filterInputType, isMultiValueEdit, isAlwaysWip) => {
  var _a;
  if (filterInputType === "key") {
    return INPUT_PLACEHOLDER;
  }
  if (filterInputType === "value") {
    if (isMultiValueEdit) {
      return "Edit values";
    }
    return ((_a = filter.valueLabels) == null ? void 0 : _a[0]) || "";
  }
  return filter[filterInputType] && !isAlwaysWip ? `${filter[filterInputType]}` : INPUT_PLACEHOLDER;
};
const populateInputValueOnInputTypeSwitch = ({
  populateInputOnEdit,
  item,
  filterInputType,
  setInputValue,
  filter
}) => {
  if (populateInputOnEdit && !isMultiValueOperator(item.value || "") && nextInputTypeMap[filterInputType] === "value") {
    setInputValue((filter == null ? void 0 : filter.value) || "");
  } else {
    setInputValue("");
  }
};

export { ERROR_STATE_DROPDOWN_WIDTH, VIRTUAL_LIST_ITEM_HEIGHT, VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION, VIRTUAL_LIST_OVERSCAN, flattenOptionGroups, fuzzySearchOptions, generateFilterUpdatePayload, generatePlaceholder, populateInputValueOnInputTypeSwitch, setupDropdownAccessibility, switchInputType, switchToNextInputType };
//# sourceMappingURL=utils.js.map
