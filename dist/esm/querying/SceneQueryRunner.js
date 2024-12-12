import { isEqual, cloneDeep } from 'lodash';
import { ReplaySubject, forkJoin } from 'rxjs';
import { LoadingState } from '@grafana/schema';
import { preProcessPanelData, DataTopic, DataFrameView, rangeUtil } from '@grafana/data';
import { getRunRequest, toDataQueryError, isExpressionReference } from '@grafana/runtime';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { sceneGraph } from '../core/sceneGraph/index.js';
import { getDataSource } from '../utils/getDataSource.js';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig.js';
import { writeSceneLog } from '../utils/writeSceneLog.js';
import { VariableValueRecorder } from '../variables/VariableValueRecorder.js';
import { emptyPanelData } from '../core/SceneDataNode.js';
import { getClosest } from '../core/sceneGraph/utils.js';
import { isExtraQueryProvider } from './ExtraQueryProvider.js';
import { extraQueryProcessingOperator, passthroughProcessor } from './extraQueryProcessingOperator.js';
import { filterAnnotations } from './layers/annotations/filterAnnotations.js';
import { getEnrichedDataRequest } from './getEnrichedDataRequest.js';
import { findActiveAdHocFilterVariableByUid } from '../variables/adhoc/patchGetAdhocFilters.js';
import { registerQueryWithController } from './registerQueryWithController.js';
import { findActiveGroupByVariablesByUid } from '../variables/groupby/findActiveGroupByVariablesByUid.js';
import { GroupByVariable } from '../variables/groupby/GroupByVariable.js';
import { AdHocFiltersVariable, isFilterComplete } from '../variables/adhoc/AdHocFiltersVariable.js';
import { DataLayersMerger } from './DataLayersMerger.js';
import { interpolate } from '../core/sceneGraph/sceneGraph.js';
import { wrapInSafeSerializableSceneObject } from '../utils/wrapInSafeSerializableSceneObject.js';

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
let counter = 100;
function getNextRequestId() {
  return "SQR" + counter++;
}
class SceneQueryRunner extends SceneObjectBase {
  constructor(initialState) {
    super(initialState);
    this._dataLayersMerger = new DataLayersMerger();
    this._variableValueRecorder = new VariableValueRecorder();
    this._results = new ReplaySubject(1);
    this._scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };
    this._variableDependency = new VariableDependencyConfig(this, {
      statePaths: ["queries", "datasource"],
      onVariableUpdateCompleted: this.onVariableUpdatesCompleted.bind(this),
      onAnyVariableChanged: this.onAnyVariableChanged.bind(this)
    });
    this.onDataReceived = (data) => {
      const preProcessedData = preProcessPanelData(data, this.state.data);
      this._resultAnnotations = data.annotations;
      const dataWithLayersApplied = this._combineDataLayers(preProcessedData);
      let hasFetchedData = this.state._hasFetchedData;
      if (!hasFetchedData && preProcessedData.state !== LoadingState.Loading) {
        hasFetchedData = true;
      }
      this.setState({ data: dataWithLayersApplied, _hasFetchedData: hasFetchedData });
      this._results.next({ origin: this, data: dataWithLayersApplied });
    };
    this.addActivationHandler(() => this._onActivate());
  }
  getResultsStream() {
    return this._results;
  }
  _onActivate() {
    if (this.isQueryModeAuto()) {
      const timeRange = sceneGraph.getTimeRange(this);
      const providers = this.getClosestExtraQueryProviders();
      for (const provider of providers) {
        this._subs.add(
          provider.subscribeToState((n, p) => {
            if (provider.shouldRerun(p, n, this.state.queries)) {
              this.runQueries();
            }
          })
        );
      }
      this.subscribeToTimeRangeChanges(
        timeRange
      );
      if (this.shouldRunQueriesOnActivate()) {
        this.runQueries();
      }
    }
    if (!this._dataLayersSub) {
      this._handleDataLayers();
    }
    return () => this._onDeactivate();
  }
  _handleDataLayers() {
    const dataLayers = sceneGraph.getDataLayers(this);
    if (dataLayers.length === 0) {
      return;
    }
    this._dataLayersSub = this._dataLayersMerger.getMergedStream(dataLayers).subscribe(this._onLayersReceived.bind(this));
  }
  _onLayersReceived(results) {
    var _a, _b, _c, _d, _e;
    const timeRange = sceneGraph.getTimeRange(this);
    const { dataLayerFilter } = this.state;
    let annotations = [];
    let alertStates = [];
    let alertState;
    for (const result of results) {
      for (let frame of result.data.series) {
        if (((_a = frame.meta) == null ? void 0 : _a.dataTopic) === DataTopic.Annotations) {
          annotations = annotations.concat(frame);
        }
        if (((_b = frame.meta) == null ? void 0 : _b.dataTopic) === DataTopic.AlertStates) {
          alertStates = alertStates.concat(frame);
        }
      }
    }
    if (dataLayerFilter == null ? void 0 : dataLayerFilter.panelId) {
      if (annotations.length > 0) {
        annotations = filterAnnotations(annotations, dataLayerFilter);
      }
      if (alertStates.length > 0) {
        for (const frame of alertStates) {
          const frameView = new DataFrameView(frame);
          for (const row of frameView) {
            if (row.panelId === dataLayerFilter.panelId) {
              alertState = row;
              break;
            }
          }
        }
      }
    }
    if (allFramesEmpty(annotations) && allFramesEmpty(this._layerAnnotations) && isEqual(alertState, (_c = this.state.data) == null ? void 0 : _c.alertState)) {
      return;
    }
    this._layerAnnotations = annotations;
    const baseStateUpdate = this.state.data ? this.state.data : __spreadProps(__spreadValues({}, emptyPanelData), { timeRange: timeRange.state.value });
    this.setState({
      data: __spreadProps(__spreadValues({}, baseStateUpdate), {
        annotations: [...(_d = this._resultAnnotations) != null ? _d : [], ...annotations],
        alertState: alertState != null ? alertState : (_e = this.state.data) == null ? void 0 : _e.alertState
      })
    });
  }
  onVariableUpdatesCompleted() {
    if (this.isQueryModeAuto()) {
      this.runQueries();
    }
  }
  onAnyVariableChanged(variable) {
    if (this._adhocFiltersVar === variable || this._groupByVar === variable || !this.isQueryModeAuto()) {
      return;
    }
    if (variable instanceof AdHocFiltersVariable && this._isRelevantAutoVariable(variable)) {
      this.runQueries();
    }
    if (variable instanceof GroupByVariable && this._isRelevantAutoVariable(variable)) {
      this.runQueries();
    }
  }
  _isRelevantAutoVariable(variable) {
    var _a, _b;
    const datasource = (_a = this.state.datasource) != null ? _a : findFirstDatasource(this.state.queries);
    return variable.state.applyMode === "auto" && (datasource == null ? void 0 : datasource.uid) === ((_b = variable.state.datasource) == null ? void 0 : _b.uid);
  }
  shouldRunQueriesOnActivate() {
    if (this._variableValueRecorder.hasDependenciesChanged(this)) {
      writeSceneLog(
        "SceneQueryRunner",
        "Variable dependency changed while inactive, shouldRunQueriesOnActivate returns true"
      );
      return true;
    }
    if (!this.state.data) {
      return true;
    }
    if (this._isDataTimeRangeStale(this.state.data)) {
      return true;
    }
    return false;
  }
  _isDataTimeRangeStale(data) {
    const timeRange = sceneGraph.getTimeRange(this);
    const stateTimeRange = timeRange.state.value;
    const dataTimeRange = data.timeRange;
    if (stateTimeRange.from.unix() === dataTimeRange.from.unix() && stateTimeRange.to.unix() === dataTimeRange.to.unix()) {
      return false;
    }
    writeSceneLog("SceneQueryRunner", "Data time range is stale");
    return true;
  }
  _onDeactivate() {
    var _a;
    if (this._querySub) {
      this._querySub.unsubscribe();
      this._querySub = void 0;
    }
    if (this._dataLayersSub) {
      this._dataLayersSub.unsubscribe();
      this._dataLayersSub = void 0;
    }
    (_a = this._timeSub) == null ? void 0 : _a.unsubscribe();
    this._timeSub = void 0;
    this._timeSubRange = void 0;
    this._adhocFiltersVar = void 0;
    this._groupByVar = void 0;
    this._variableValueRecorder.recordCurrentDependencyValuesForSceneObject(this);
  }
  setContainerWidth(width) {
    if (!this._containerWidth && width > 0) {
      this._containerWidth = width;
      if (this.state.maxDataPointsFromWidth && !this.state.maxDataPoints) {
        setTimeout(() => {
          if (this.isActive && !this.state._hasFetchedData) {
            this.runQueries();
          }
        }, 0);
      }
    } else {
      if (width > 0) {
        this._containerWidth = width;
      }
    }
  }
  isDataReadyToDisplay() {
    return Boolean(this.state._hasFetchedData);
  }
  subscribeToTimeRangeChanges(timeRange) {
    if (this._timeSubRange === timeRange) {
      return;
    }
    if (this._timeSub) {
      this._timeSub.unsubscribe();
    }
    this._timeSubRange = timeRange;
    this._timeSub = timeRange.subscribeToState(() => {
      this.runWithTimeRange(timeRange);
    });
  }
  runQueries() {
    const timeRange = sceneGraph.getTimeRange(this);
    if (this.isQueryModeAuto()) {
      this.subscribeToTimeRangeChanges(timeRange);
    }
    this.runWithTimeRange(timeRange);
  }
  getMaxDataPoints() {
    var _a;
    if (this.state.maxDataPoints) {
      return this.state.maxDataPoints;
    }
    return this.state.maxDataPointsFromWidth ? (_a = this._containerWidth) != null ? _a : 500 : 500;
  }
  cancelQuery() {
    var _a;
    (_a = this._querySub) == null ? void 0 : _a.unsubscribe();
    if (this._dataLayersSub) {
      this._dataLayersSub.unsubscribe();
      this._dataLayersSub = void 0;
    }
    this.setState({
      data: __spreadProps(__spreadValues({}, this.state.data), { state: LoadingState.Done })
    });
  }
  async runWithTimeRange(timeRange) {
    var _a, _b, _c;
    if (!this.state.maxDataPoints && this.state.maxDataPointsFromWidth && !this._containerWidth) {
      return;
    }
    if (!this._dataLayersSub) {
      this._handleDataLayers();
    }
    (_a = this._querySub) == null ? void 0 : _a.unsubscribe();
    if (this._variableDependency.hasDependencyInLoadingState()) {
      writeSceneLog("SceneQueryRunner", "Variable dependency is in loading state, skipping query execution");
      this.setState({ data: __spreadProps(__spreadValues({}, (_b = this.state.data) != null ? _b : emptyPanelData), { state: LoadingState.Loading }) });
      return;
    }
    const { queries } = this.state;
    if (!(queries == null ? void 0 : queries.length)) {
      this._setNoDataState();
      return;
    }
    try {
      const datasource = (_c = this.state.datasource) != null ? _c : findFirstDatasource(queries);
      const ds = await getDataSource(datasource, this._scopedVars);
      this.findAndSubscribeToAdHocFilters(datasource == null ? void 0 : datasource.uid);
      const runRequest = getRunRequest();
      const { primary, secondaries, processors } = this.prepareRequests(timeRange, ds);
      writeSceneLog("SceneQueryRunner", "Starting runRequest", this.state.key);
      let stream = runRequest(ds, primary);
      if (secondaries.length > 0) {
        const secondaryStreams = secondaries.map((r) => runRequest(ds, r));
        const op = extraQueryProcessingOperator(processors);
        stream = forkJoin([stream, ...secondaryStreams]).pipe(op);
      }
      stream = stream.pipe(
        registerQueryWithController({
          type: "data",
          request: primary,
          origin: this,
          cancel: () => this.cancelQuery()
        })
      );
      this._querySub = stream.subscribe(this.onDataReceived);
    } catch (err) {
      console.error("PanelQueryRunner Error", err);
      this.onDataReceived(__spreadProps(__spreadValues(__spreadValues({}, emptyPanelData), this.state.data), {
        state: LoadingState.Error,
        errors: [toDataQueryError(err)]
      }));
    }
  }
  clone(withState) {
    var _a;
    const clone = super.clone(withState);
    if (this._resultAnnotations) {
      clone["_resultAnnotations"] = this._resultAnnotations.map((frame) => __spreadValues({}, frame));
    }
    if (this._layerAnnotations) {
      clone["_layerAnnotations"] = this._layerAnnotations.map((frame) => __spreadValues({}, frame));
    }
    clone["_variableValueRecorder"] = this._variableValueRecorder.cloneAndRecordCurrentValuesForSceneObject(this);
    clone["_containerWidth"] = this._containerWidth;
    clone["_results"].next({ origin: this, data: (_a = this.state.data) != null ? _a : emptyPanelData });
    return clone;
  }
  prepareRequests(timeRange, ds) {
    var _a;
    const { minInterval, queries } = this.state;
    let request = __spreadValues({
      app: "scenes",
      requestId: getNextRequestId(),
      timezone: timeRange.getTimeZone(),
      range: timeRange.state.value,
      interval: "1s",
      intervalMs: 1e3,
      targets: cloneDeep(queries),
      maxDataPoints: this.getMaxDataPoints(),
      scopedVars: this._scopedVars,
      startTime: Date.now(),
      liveStreaming: this.state.liveStreaming,
      rangeRaw: {
        from: timeRange.state.from,
        to: timeRange.state.to
      },
      cacheTimeout: this.state.cacheTimeout,
      queryCachingTTL: this.state.queryCachingTTL
    }, getEnrichedDataRequest(this));
    if (this._adhocFiltersVar) {
      request.filters = this._adhocFiltersVar.state.filters.filter(isFilterComplete);
    }
    if (this._groupByVar) {
      request.groupByKeys = this._groupByVar.state.value;
    }
    request.targets = request.targets.map((query) => {
      var _a2;
      if (!query.datasource || query.datasource.uid !== ds.uid && !((_a2 = ds.meta) == null ? void 0 : _a2.mixed) && isExpressionReference && !isExpressionReference(query.datasource)) {
        query.datasource = ds.getRef();
      }
      return query;
    });
    const lowerIntervalLimit = minInterval ? interpolate(this, minInterval) : ds.interval;
    const norm = rangeUtil.calculateInterval(timeRange.state.value, request.maxDataPoints, lowerIntervalLimit);
    request.scopedVars = Object.assign({}, request.scopedVars, {
      __interval: { text: norm.interval, value: norm.interval },
      __interval_ms: { text: norm.intervalMs.toString(), value: norm.intervalMs }
    });
    request.interval = norm.interval;
    request.intervalMs = norm.intervalMs;
    const primaryTimeRange = timeRange.state.value;
    let secondaryRequests = [];
    let secondaryProcessors = /* @__PURE__ */ new Map();
    for (const provider of (_a = this.getClosestExtraQueryProviders()) != null ? _a : []) {
      for (const { req, processor } of provider.getExtraQueries(request)) {
        const requestId = getNextRequestId();
        secondaryRequests.push(__spreadProps(__spreadValues({}, req), { requestId }));
        secondaryProcessors.set(requestId, processor != null ? processor : passthroughProcessor);
      }
    }
    request.range = primaryTimeRange;
    return { primary: request, secondaries: secondaryRequests, processors: secondaryProcessors };
  }
  _combineDataLayers(data) {
    if (this._layerAnnotations && this._layerAnnotations.length > 0) {
      data.annotations = (data.annotations || []).concat(this._layerAnnotations);
    }
    if (this.state.data && this.state.data.alertState) {
      data.alertState = this.state.data.alertState;
    }
    return data;
  }
  _setNoDataState() {
    if (this.state.data !== emptyPanelData) {
      this.setState({ data: emptyPanelData });
    }
  }
  getClosestExtraQueryProviders() {
    const found = /* @__PURE__ */ new Map();
    if (!this.parent) {
      return [];
    }
    getClosest(this.parent, (s) => {
      if (isExtraQueryProvider(s) && !found.has(s.constructor)) {
        found.set(s.constructor, s);
      }
      s.forEachChild((child) => {
        if (isExtraQueryProvider(child) && !found.has(child.constructor)) {
          found.set(child.constructor, child);
        }
      });
      return null;
    });
    return Array.from(found.values());
  }
  findAndSubscribeToAdHocFilters(uid) {
    const filtersVar = findActiveAdHocFilterVariableByUid(uid);
    if (this._adhocFiltersVar !== filtersVar) {
      this._adhocFiltersVar = filtersVar;
      this._updateExplicitVariableDependencies();
    }
    const groupByVar = findActiveGroupByVariablesByUid(uid);
    if (this._groupByVar !== groupByVar) {
      this._groupByVar = groupByVar;
      this._updateExplicitVariableDependencies();
    }
  }
  _updateExplicitVariableDependencies() {
    const explicitDependencies = [];
    if (this._adhocFiltersVar) {
      explicitDependencies.push(this._adhocFiltersVar.state.name);
    }
    if (this._groupByVar) {
      explicitDependencies.push(this._groupByVar.state.name);
    }
    this._variableDependency.setVariableNames(explicitDependencies);
  }
  isQueryModeAuto() {
    var _a;
    return ((_a = this.state.runQueriesMode) != null ? _a : "auto") === "auto";
  }
}
function findFirstDatasource(targets) {
  var _a, _b;
  return (_b = (_a = targets.find((t) => t.datasource !== null)) == null ? void 0 : _a.datasource) != null ? _b : void 0;
}
function allFramesEmpty(frames) {
  if (!frames) {
    return true;
  }
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].length > 0) {
      return false;
    }
  }
  return true;
}

export { SceneQueryRunner, findFirstDatasource, getNextRequestId };
//# sourceMappingURL=SceneQueryRunner.js.map
