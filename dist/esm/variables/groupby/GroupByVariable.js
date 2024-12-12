import React, { useMemo, useState, useEffect } from 'react';
import { allActiveGroupByVariables } from './findActiveGroupByVariablesByUid.js';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { MultiValueVariable } from '../variants/MultiValueVariable.js';
import { map, of, from, mergeMap, tap, take, lastValueFrom } from 'rxjs';
import { getDataSource } from '../../utils/getDataSource.js';
import { MultiSelect } from '@grafana/ui';
import { isArray } from 'lodash';
import { dataFromResponse, getQueriesForVariables, responseHasError, handleOptionGroups } from '../utils.js';
import { OptionWithCheckbox } from '../components/VariableValueSelect.js';
import { GroupByVariableUrlSyncHandler } from './GroupByVariableUrlSyncHandler.js';
import { getOptionSearcher } from '../components/getOptionSearcher.js';
import { getEnrichedFiltersRequest } from '../getEnrichedFiltersRequest.js';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject.js';

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
class GroupByVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadProps(__spreadValues({
      isMulti: true,
      name: "",
      value: [],
      text: [],
      options: [],
      datasource: null,
      baseFilters: [],
      applyMode: "auto",
      layout: "horizontal",
      type: "groupby"
    }, initialState), {
      noValueOnClear: true
    }));
    this.isLazy = true;
    this._urlSync = new GroupByVariableUrlSyncHandler(this);
    this._getKeys = async (ds) => {
      var _a, _b, _c;
      const override = await ((_b = (_a = this.state).getTagKeysProvider) == null ? void 0 : _b.call(_a, this, null));
      if (override && override.replace) {
        return override.values;
      }
      if (this.state.defaultOptions) {
        return this.state.defaultOptions.concat(dataFromResponse((_c = override == null ? void 0 : override.values) != null ? _c : []));
      }
      if (!ds.getTagKeys) {
        return [];
      }
      const queries = getQueriesForVariables(this);
      const otherFilters = this.state.baseFilters || [];
      const timeRange = sceneGraph.getTimeRange(this).state.value;
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
      return keys;
    };
    this.addActivationHandler(() => {
      allActiveGroupByVariables.add(this);
      return () => allActiveGroupByVariables.delete(this);
    });
  }
  validateAndUpdate() {
    return this.getValueOptions({}).pipe(
      map((options) => {
        this._updateValueGivenNewOptions(options);
        return {};
      })
    );
  }
  _updateValueGivenNewOptions(options) {
    const { value: currentValue, text: currentText } = this.state;
    const stateUpdate = {
      options,
      loading: false,
      value: currentValue != null ? currentValue : [],
      text: currentText != null ? currentText : []
    };
    this.setState(stateUpdate);
  }
  getValueOptions(args) {
    if (this.state.defaultOptions) {
      return of(
        this.state.defaultOptions.map((o) => ({
          label: o.text,
          value: String(o.value),
          group: o.group
        }))
      );
    }
    this.setState({ loading: true, error: null });
    return from(
      getDataSource(this.state.datasource, {
        __sceneObject: wrapInSafeSerializableSceneObject(this)
      })
    ).pipe(
      mergeMap((ds) => {
        return from(this._getKeys(ds)).pipe(
          tap((response) => {
            if (responseHasError(response)) {
              this.setState({ error: response.error.message });
            }
          }),
          map((response) => dataFromResponse(response)),
          take(1),
          mergeMap((data) => {
            const a = data.map((i) => {
              return {
                label: i.text,
                value: i.value ? String(i.value) : i.text,
                group: i.group
              };
            });
            return of(a);
          })
        );
      })
    );
  }
  getDefaultMultiState(options) {
    return { value: [], text: [] };
  }
}
GroupByVariable.Component = GroupByVariableRenderer;
function GroupByVariableRenderer({ model }) {
  const { value, text, key, maxVisibleValues, noValueOnClear, options, includeAll } = model.useState();
  const values = useMemo(() => {
    const arrayValue = isArray(value) ? value : [value];
    const arrayText = isArray(text) ? text : [text];
    return arrayValue.map((value2, idx) => {
      var _a;
      return {
        value: value2,
        label: String((_a = arrayText[idx]) != null ? _a : value2)
      };
    });
  }, [value, text]);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [uncommittedValue, setUncommittedValue] = useState(values);
  const optionSearcher = useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);
  useEffect(() => {
    setUncommittedValue(values);
  }, [values]);
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
  const filteredOptions = useMemo(
    () => handleOptionGroups(optionSearcher(inputValue).map(toSelectableValue)),
    [optionSearcher, inputValue]
  );
  return /* @__PURE__ */ React.createElement(MultiSelect, {
    "data-testid": `GroupBySelect-${key}`,
    id: key,
    placeholder: "Select value",
    width: "auto",
    inputValue,
    value: uncommittedValue,
    noMultiValueWrap: true,
    maxVisibleValues: maxVisibleValues != null ? maxVisibleValues : 5,
    tabSelectsValue: false,
    virtualized: true,
    options: filteredOptions,
    filterOption: filterNoOp,
    closeMenuOnSelect: false,
    isOpen: isOptionsOpen,
    isClearable: true,
    hideSelectedOptions: false,
    isLoading: isFetchingOptions,
    components: { Option: OptionWithCheckbox },
    onInputChange,
    onBlur: () => {
      model.changeValueTo(
        uncommittedValue.map((x) => x.value),
        uncommittedValue.map((x) => x.label)
      );
    },
    onChange: (newValue, action) => {
      if (action.action === "clear" && noValueOnClear) {
        model.changeValueTo([]);
      }
      setUncommittedValue(newValue);
    },
    onOpenMenu: async () => {
      setIsFetchingOptions(true);
      await lastValueFrom(model.validateAndUpdate());
      setIsFetchingOptions(false);
      setIsOptionsOpen(true);
    },
    onCloseMenu: () => {
      setIsOptionsOpen(false);
    }
  });
}
const filterNoOp = () => true;
function toSelectableValue(input) {
  const { label, value, group } = input;
  const result = {
    label,
    value
  };
  if (group) {
    result.group = group;
  }
  return result;
}

export { GroupByVariable, GroupByVariableRenderer };
//# sourceMappingURL=GroupByVariable.js.map
