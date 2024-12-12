import { lastValueFrom, of, from, mergeMap, filter, take, throwError, catchError } from 'rxjs';
import { v4 } from 'uuid';
import { VariableRefresh, VariableSort, LoadingState, CoreApp } from '@grafana/data';
import { sceneGraph } from '../../../core/sceneGraph/index.js';
import { VariableDependencyConfig } from '../../VariableDependencyConfig.js';
import { renderSelectForVariable } from '../../components/VariableValueSelect.js';
import { MultiValueVariable } from '../MultiValueVariable.js';
import { createQueryVariableRunner } from './createQueryVariableRunner.js';
import { metricNamesToVariableValues } from './utils.js';
import { toMetricFindValues } from './toMetricFindValues.js';
import { getDataSource } from '../../../utils/getDataSource.js';
import { safeStringifyValue } from '../../utils.js';
import { SEARCH_FILTER_VARIABLE } from '../../constants.js';
import { debounce } from 'lodash';
import { registerQueryWithController } from '../../../querying/registerQueryWithController.js';
import { wrapInSafeSerializableSceneObject } from '../../../utils/wrapInSafeSerializableSceneObject.js';

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
class QueryVariable extends MultiValueVariable {
  constructor(initialState) {
    super(__spreadValues({
      type: "query",
      name: "",
      value: "",
      text: "",
      options: [],
      datasource: null,
      regex: "",
      query: "",
      refresh: VariableRefresh.onDashboardLoad,
      sort: VariableSort.disabled
    }, initialState));
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["regex", "query", "datasource"]
    });
    this.onSearchChange = (searchFilter) => {
      if (!containsSearchFilter(this.state.query)) {
        return;
      }
      this._updateOptionsBasedOnSearchFilter(searchFilter);
    };
    this._updateOptionsBasedOnSearchFilter = debounce(async (searchFilter) => {
      const result = await lastValueFrom(this.getValueOptions({ searchFilter }));
      this.setState({ options: result, loading: false });
    }, 400);
  }
  getValueOptions(args) {
    if (!this.state.query) {
      return of([]);
    }
    this.setState({ loading: true, error: null });
    return from(
      getDataSource(this.state.datasource, {
        __sceneObject: wrapInSafeSerializableSceneObject(this)
      })
    ).pipe(
      mergeMap((ds) => {
        const runner = createQueryVariableRunner(ds);
        const target = runner.getTarget(this);
        const request = this.getRequest(target, args.searchFilter);
        return runner.runRequest({ variable: this, searchFilter: args.searchFilter }, request).pipe(
          registerQueryWithController({
            type: "variable",
            request,
            origin: this
          }),
          filter((data) => data.state === LoadingState.Done || data.state === LoadingState.Error),
          take(1),
          mergeMap((data) => {
            if (data.state === LoadingState.Error) {
              return throwError(() => data.error);
            }
            return of(data);
          }),
          toMetricFindValues(),
          mergeMap((values) => {
            let regex = "";
            if (this.state.regex) {
              regex = sceneGraph.interpolate(this, this.state.regex, void 0, "regex");
            }
            return of(metricNamesToVariableValues(regex, this.state.sort, values));
          }),
          catchError((error) => {
            if (error.cancelled) {
              return of([]);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }
  getRequest(target, searchFilter) {
    const scopedVars = {
      __sceneObject: wrapInSafeSerializableSceneObject(this)
    };
    if (searchFilter) {
      scopedVars.__searchFilter = { value: searchFilter, text: searchFilter };
    }
    const range = sceneGraph.getTimeRange(this).state.value;
    const request = {
      app: CoreApp.Dashboard,
      requestId: v4(),
      timezone: "",
      range,
      interval: "",
      intervalMs: 0,
      targets: [target],
      scopedVars,
      startTime: Date.now()
    };
    return request;
  }
}
QueryVariable.Component = ({ model }) => {
  return renderSelectForVariable(model);
};
function containsSearchFilter(query) {
  const str = safeStringifyValue(query);
  return str.indexOf(SEARCH_FILTER_VARIABLE) > -1;
}

export { QueryVariable };
//# sourceMappingURL=QueryVariable.js.map
