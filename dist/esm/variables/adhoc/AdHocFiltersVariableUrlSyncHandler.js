import { isFilterComplete, isMultiValueOperator } from './AdHocFiltersVariable.js';
import { escapeUrlPipeDelimiters, toUrlCommaDelimitedString, unescapeUrlDelimiters } from '../utils.js';

class AdHocFiltersVariableUrlSyncHandler {
  constructor(_variable) {
    this._variable = _variable;
  }
  getKey() {
    return `var-${this._variable.state.name}`;
  }
  getKeys() {
    return [this.getKey()];
  }
  getUrlState() {
    const filters = this._variable.state.filters;
    if (filters.length === 0) {
      return { [this.getKey()]: [""] };
    }
    const value = filters.filter(isFilterComplete).map((filter) => toArray(filter).map(escapeUrlPipeDelimiters).join("|"));
    return { [this.getKey()]: value };
  }
  updateFromUrl(values) {
    const urlValue = values[this.getKey()];
    if (urlValue == null) {
      return;
    }
    const filters = deserializeUrlToFilters(urlValue);
    this._variable.setState({ filters });
  }
}
function deserializeUrlToFilters(value) {
  if (Array.isArray(value)) {
    const values = value;
    return values.map(toFilter).filter(isFilter);
  }
  const filter = toFilter(value);
  return filter === null ? [] : [filter];
}
function toArray(filter) {
  var _a;
  const result = [
    toUrlCommaDelimitedString(filter.key, filter.keyLabel),
    filter.operator
  ];
  if (isMultiValueOperator(filter.operator)) {
    filter.values.forEach((value, index) => {
      var _a2;
      result.push(toUrlCommaDelimitedString(value, (_a2 = filter.valueLabels) == null ? void 0 : _a2[index]));
    });
  } else {
    result.push(toUrlCommaDelimitedString(filter.value, (_a = filter.valueLabels) == null ? void 0 : _a[0]));
  }
  return result;
}
function toFilter(urlValue) {
  if (typeof urlValue !== "string" || urlValue.length === 0) {
    return null;
  }
  const [key, keyLabel, operator, _operatorLabel, ...values] = urlValue.split("|").reduce((acc, v) => {
    const [key2, label] = v.split(",");
    acc.push(key2, label != null ? label : key2);
    return acc;
  }, []).map(unescapeUrlDelimiters);
  return {
    key,
    keyLabel,
    operator,
    value: values[0],
    values: isMultiValueOperator(operator) ? values.filter((_, index) => index % 2 === 0) : void 0,
    valueLabels: values.filter((_, index) => index % 2 === 1),
    condition: ""
  };
}
function isFilter(filter) {
  return filter !== null && typeof filter.key === "string" && typeof filter.value === "string";
}

export { AdHocFiltersVariableUrlSyncHandler };
//# sourceMappingURL=AdHocFiltersVariableUrlSyncHandler.js.map
