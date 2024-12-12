import React from 'react';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { SceneVariableValueChangedEvent } from '../types.js';
import { dataFromResponse, getQueriesForVariables, responseHasError, renderPrometheusLabelFilters } from '../utils.js';
import { patchGetAdhocFilters } from './patchGetAdhocFilters.js';
import { useStyles2 } from '@grafana/ui';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { AdHocFilterBuilder } from './AdHocFilterBuilder.js';
import { AdHocFilterRenderer } from './AdHocFilterRenderer.js';
import { getDataSourceSrv } from '@grafana/runtime';
import { AdHocFiltersVariableUrlSyncHandler } from './AdHocFiltersVariableUrlSyncHandler.js';
import { css } from '@emotion/css';
import { getEnrichedFiltersRequest } from '../getEnrichedFiltersRequest.js';
import { AdHocFiltersComboboxRenderer } from './AdHocFiltersCombobox/AdHocFiltersComboboxRenderer.js';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject.js';

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
const OPERATORS = [
  {
    value: "=",
    description: "Equals"
  },
  {
    value: "!=",
    description: "Not equal"
  },
  {
    value: "=|",
    description: "One of. Use to filter on multiple values.",
    isMulti: true
  },
  {
    value: "!=|",
    description: "Not one of. Use to exclude multiple values.",
    isMulti: true
  },
  {
    value: "=~",
    description: "Matches regex"
  },
  {
    value: "!~",
    description: "Does not match regex"
  },
  {
    value: "<",
    description: "Less than"
  },
  {
    value: ">",
    description: "Greater than"
  }
];
class AdHocFiltersVariable extends SceneObjectBase {
  constructor(state) {
    var _a, _b;
    super(__spreadValues({
      type: "adhoc",
      name: (_a = state.name) != null ? _a : "Filters",
      filters: [],
      datasource: null,
      applyMode: "auto",
      filterExpression: (_b = state.filterExpression) != null ? _b : renderExpression(state.expressionBuilder, state.filters)
    }, state));
    this._scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };
    this._dataSourceSrv = getDataSourceSrv();
    this._urlSync = new AdHocFiltersVariableUrlSyncHandler(this);
    if (this.state.applyMode === "auto") {
      patchGetAdhocFilters(this);
    }
  }
  setState(update) {
    let filterExpressionChanged = false;
    if (update.filters && update.filters !== this.state.filters && !update.filterExpression) {
      update.filterExpression = renderExpression(this.state.expressionBuilder, update.filters);
      filterExpressionChanged = update.filterExpression !== this.state.filterExpression;
    }
    super.setState(update);
    if (filterExpressionChanged) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
  getValue() {
    return this.state.filterExpression;
  }
  _updateFilter(filter, update) {
    const { filters, _wip } = this.state;
    if (filter === _wip) {
      if ("value" in update && update["value"] !== "") {
        this.setState({ filters: [...filters, __spreadValues(__spreadValues({}, _wip), update)], _wip: void 0 });
      } else {
        this.setState({ _wip: __spreadValues(__spreadValues({}, filter), update) });
      }
      return;
    }
    const updatedFilters = this.state.filters.map((f) => {
      return f === filter ? __spreadValues(__spreadValues({}, f), update) : f;
    });
    this.setState({ filters: updatedFilters });
  }
  _removeFilter(filter) {
    if (filter === this.state._wip) {
      this.setState({ _wip: void 0 });
      return;
    }
    this.setState({ filters: this.state.filters.filter((f) => f !== filter) });
  }
  _removeLastFilter() {
    const filterToRemove = this.state.filters.at(-1);
    if (filterToRemove) {
      this._removeFilter(filterToRemove);
    }
  }
  async _getKeys(currentKey) {
    var _a, _b, _c;
    const override = await ((_b = (_a = this.state).getTagKeysProvider) == null ? void 0 : _b.call(_a, this, currentKey));
    if (override && override.replace) {
      return dataFromResponse(override.values).map(toSelectableValue);
    }
    if (this.state.defaultKeys) {
      return this.state.defaultKeys.map(toSelectableValue);
    }
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagKeys) {
      return [];
    }
    const otherFilters = this.state.filters.filter((f) => f.key !== currentKey).concat((_c = this.state.baseFilters) != null ? _c : []);
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : void 0;
    const response = await ds.getTagKeys(__spreadValues({
      filters: otherFilters,
      queries,
      timeRange
    }, getEnrichedFiltersRequest(this)));
    if (responseHasError(response)) {
      this.setState({ error: response.error.message });
    }
    let keys = dataFromResponse(response);
    if (override) {
      keys = keys.concat(dataFromResponse(override.values));
    }
    const tagKeyRegexFilter = this.state.tagKeyRegexFilter;
    if (tagKeyRegexFilter) {
      keys = keys.filter((f) => f.text.match(tagKeyRegexFilter));
    }
    return keys.map(toSelectableValue);
  }
  async _getValuesFor(filter) {
    var _a, _b, _c;
    const override = await ((_b = (_a = this.state).getTagValuesProvider) == null ? void 0 : _b.call(_a, this, filter));
    if (override && override.replace) {
      return dataFromResponse(override.values).map(toSelectableValue);
    }
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagValues) {
      return [];
    }
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat((_c = this.state.baseFilters) != null ? _c : []);
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : void 0;
    const response = await ds.getTagValues(__spreadValues({
      key: filter.key,
      filters: otherFilters,
      timeRange,
      queries
    }, getEnrichedFiltersRequest(this)));
    if (responseHasError(response)) {
      this.setState({ error: response.error.message });
    }
    let values = dataFromResponse(response);
    if (override) {
      values = values.concat(dataFromResponse(override.values));
    }
    return values.map(toSelectableValue);
  }
  _addWip() {
    this.setState({
      _wip: { key: "", value: "", operator: "=", condition: "" }
    });
  }
  _getOperators() {
    const filteredOperators = this.state.supportsMultiValueOperators ? OPERATORS : OPERATORS.filter((operator) => !operator.isMulti);
    return filteredOperators.map(({ value, description }) => ({
      label: value,
      value,
      description
    }));
  }
}
AdHocFiltersVariable.Component = AdHocFiltersVariableRenderer;
function renderExpression(builder, filters) {
  return (builder != null ? builder : renderPrometheusLabelFilters)(filters != null ? filters : []);
}
function AdHocFiltersVariableRenderer({ model }) {
  const { filters, readOnly, addFilterButtonText } = model.useState();
  const styles = useStyles2(getStyles);
  if (model.state.layout === "combobox") {
    return /* @__PURE__ */ React.createElement(AdHocFiltersComboboxRenderer, {
      model
    });
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.wrapper
  }, filters.map((filter, index) => /* @__PURE__ */ React.createElement(React.Fragment, {
    key: index
  }, /* @__PURE__ */ React.createElement(AdHocFilterRenderer, {
    filter,
    model
  }))), !readOnly && /* @__PURE__ */ React.createElement(AdHocFilterBuilder, {
    model,
    key: "'builder",
    addFilterButtonText
  }));
}
const getStyles = (theme) => ({
  wrapper: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(1)
  })
});
function toSelectableValue(input) {
  const { text, value } = input;
  const result = {
    label: text,
    value: String(value != null ? value : text)
  };
  if ("group" in input) {
    result.group = input.group;
  }
  return result;
}
function isFilterComplete(filter) {
  return filter.key !== "" && filter.operator !== "" && filter.value !== "";
}
function isMultiValueOperator(operatorValue) {
  const operator = OPERATORS.find((o) => o.value === operatorValue);
  if (!operator) {
    return false;
  }
  return Boolean(operator.isMulti);
}

export { AdHocFiltersVariable, AdHocFiltersVariableRenderer, OPERATORS, isFilterComplete, isMultiValueOperator, toSelectableValue };
//# sourceMappingURL=AdHocFiltersVariable.js.map
