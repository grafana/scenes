import { cloneDeep, isEqual } from 'lodash';
import { forkJoin, ReplaySubject, Unsubscribable } from 'rxjs';

import { DataQuery, DataSourceRef, LoadingState } from '@grafana/schema';

import {
  AlertStateInfo,
  DataFrame,
  DataFrameView,
  DataQueryRequest,
  DataSourceApi,
  DataTopic,
  PanelData,
  preProcessPanelData,
  rangeUtil,
} from '@grafana/data';

// TODO: Remove this ignore annotation when the grafana runtime dependency has been updated
// @ts-ignore
import { getRunRequest, toDataQueryError, isExpressionReference, config } from '@grafana/runtime';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import {
  DataLayerFilter,
  SceneDataProvider,
  SceneDataProviderResult,
  SceneDataQuery,
  SceneObjectState,
  SceneTimeRangeLike,
} from '../core/types';
import { getDataSource } from '../utils/getDataSource';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { writeSceneLog } from '../utils/writeSceneLog';
import { VariableValueRecorder } from '../variables/VariableValueRecorder';
import { emptyPanelData } from '../core/SceneDataNode';
import { getClosest } from '../core/sceneGraph/utils';
import { isExtraQueryProvider, ExtraQueryDataProcessor, ExtraQueryProvider } from './ExtraQueryProvider';
import { passthroughProcessor, extraQueryProcessingOperator } from './extraQueryProcessingOperator';
import { filterAnnotations } from './layers/annotations/filterAnnotations';
import { getEnrichedDataRequest } from './getEnrichedDataRequest';
import { registerQueryWithController } from './registerQueryWithController';
import { GroupByVariable } from '../variables/groupby/GroupByVariable';
import { AdHocFiltersVariable } from '../variables/adhoc/AdHocFiltersVariable';
import { SceneVariable } from '../variables/types';
import { DataLayersMerger } from './DataLayersMerger';
import { interpolate } from '../core/sceneGraph/sceneGraph';
import { wrapInSafeSerializableSceneObject } from '../utils/wrapInSafeSerializableSceneObject';
import { DrilldownDependenciesManager } from '../variables/DrilldownDependenciesManager';

let counter = 100;

export function getNextRequestId() {
  return 'SQR' + counter++;
}

export interface QueryRunnerState extends SceneObjectState {
  data?: PanelData;
  queries: SceneDataQuery[];
  datasource?: DataSourceRef;
  minInterval?: string;
  maxDataPoints?: number;
  liveStreaming?: boolean;
  maxDataPointsFromWidth?: boolean;
  cacheTimeout?: DataQueryRequest['cacheTimeout'];
  queryCachingTTL?: DataQueryRequest['queryCachingTTL'];
  /**
   * When set to auto (the default) query runner will issue queries on activate (when variable dependencies are ready) or when time range change.
   * Set to manual to have full manual control over when queries are issued. Try not to set this. This is mainly useful for unit tests, or special edge case workflows.
   */
  runQueriesMode?: 'auto' | 'manual';
  // Filters to be applied to data layer results before combining them with SQR results
  dataLayerFilter?: DataLayerFilter;
  // Private runtime state
  _hasFetchedData?: boolean;
}

export interface DataQueryExtended extends DataQuery {
  [key: string]: any;

  // Opt this query out of time window comparison
  timeRangeCompare?: boolean;
}

// The requests that will be run by the query runner.
//
// Generally the query runner will run a single primary request.
// If the scene graph contains implementations of
// `ExtraQueryProvider`, the requests created by these
// implementations will be added to the list of secondary requests,
// and these will be executed at the same time as the primary request.
//
// The results of each secondary request will be passed to an associated
// processor function (along with the results of the primary request),
// which can transform the results as desired.
interface PreparedRequests {
  // The primary request to run.
  primary: DataQueryRequest;
  // A possibly empty list of secondary requests to run alongside
  // the primary request.
  secondaries: DataQueryRequest[];
  // A map from `requestId` of secondary requests to processors
  // for those requests. Provided by the `ExtraQueryProvider`.
  processors: Map<string, ExtraQueryDataProcessor>;
}

export class SceneQueryRunner extends SceneObjectBase<QueryRunnerState> implements SceneDataProvider {
  private _querySub?: Unsubscribable;
  private _dataLayersSub?: Unsubscribable;
  private _dataLayersMerger = new DataLayersMerger();
  private _timeSub?: Unsubscribable;
  private _timeSubRange?: SceneTimeRangeLike;
  private _containerWidth?: number;
  private _variableValueRecorder = new VariableValueRecorder();
  private _results = new ReplaySubject<SceneDataProviderResult>(1);
  private _scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };
  private _layerAnnotations?: DataFrame[];
  private _resultAnnotations?: DataFrame[];
  private _isInView = true;
  private _bypassIsInView = false;
  private _queryNotExecutedWhenOutOfView = false;

  public getResultsStream() {
    return this._results;
  }

  protected _variableDependency: VariableDependencyConfig<QueryRunnerState> = new VariableDependencyConfig(this, {
    statePaths: ['queries', 'datasource', 'minInterval'],
    onVariableUpdateCompleted: this.onVariableUpdatesCompleted.bind(this),
    onAnyVariableChanged: this.onAnyVariableChanged.bind(this),
    dependsOnScopes: true,
  });

  private _drilldownDependenciesManager: DrilldownDependenciesManager<QueryRunnerState> =
    new DrilldownDependenciesManager(this._variableDependency);

  public constructor(initialState: QueryRunnerState) {
    super(initialState);

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    if (this.isQueryModeAuto()) {
      const timeRange = sceneGraph.getTimeRange(this);

      // Add subscriptions to any extra providers so that they rerun queries
      // when their state changes and they should rerun.
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

      this.subscribeToTimeRangeChanges(timeRange);

      if (this.shouldRunQueriesOnActivate()) {
        this.runQueries();
      }
    }

    if (!this._dataLayersSub) {
      this._handleDataLayers();
    }

    return () => this._onDeactivate();
  }

  // This method subscribes to all SceneDataLayers up until the root, and combines the results into data provided from SceneQueryRunner
  private _handleDataLayers() {
    const dataLayers = sceneGraph.getDataLayers(this);

    if (dataLayers.length === 0) {
      return;
    }

    this._dataLayersSub = this._dataLayersMerger
      .getMergedStream(dataLayers)
      .subscribe(this._onLayersReceived.bind(this));
  }

  private _onLayersReceived(results: Iterable<SceneDataProviderResult>) {
    const timeRange = sceneGraph.getTimeRange(this);
    const { dataLayerFilter } = this.state;

    let annotations: DataFrame[] = [];
    let alertStates: DataFrame[] = [];
    let alertState: AlertStateInfo | undefined;

    for (const result of results) {
      for (let frame of result.data.series) {
        if (frame.meta?.dataTopic === DataTopic.Annotations) {
          annotations = annotations.concat(frame);
        }
        if (frame.meta?.dataTopic === DataTopic.AlertStates) {
          alertStates = alertStates.concat(frame);
        }
      }
    }

    if (dataLayerFilter?.panelId) {
      if (annotations.length > 0) {
        annotations = filterAnnotations(annotations, dataLayerFilter);
      }

      if (alertStates.length > 0) {
        for (const frame of alertStates) {
          const frameView = new DataFrameView<AlertStateInfo>(frame);

          for (const row of frameView) {
            if (row.panelId === dataLayerFilter.panelId) {
              alertState = row;
              break;
            }
          }
        }
      }
    }

    // Skip unnessary state updates
    if (
      allFramesEmpty(annotations) &&
      allFramesEmpty(this._layerAnnotations) &&
      isEqual(alertState, this.state.data?.alertState)
    ) {
      return;
    }

    this._layerAnnotations = annotations;

    const baseStateUpdate = this.state.data ? this.state.data : { ...emptyPanelData, timeRange: timeRange.state.value };

    this.setState({
      data: {
        ...baseStateUpdate,
        annotations: [...(this._resultAnnotations ?? []), ...annotations],
        alertState: alertState ?? this.state.data?.alertState,
      },
    });
  }

  /**
   * This tries to start a new query whenever a variable completes or is changed.
   *
   * We care about variable update completions even when the variable has not changed and even when it is not a direct dependency.
   * Example: Variables A and B (B depends on A). A update depends on time range. So when time change query runner will
   * find that variable A is loading which is a dependency on of variable B so will set _isWaitingForVariables to true and
   * not issue any query.
   *
   * When A completes it's loading (with no value change, so B never updates) it will cause a call of this function letting
   * the query runner know that A has completed, and in case _isWaitingForVariables we try to run the query. The query will
   * only run if all variables are in a non loading state so in other scenarios where a query depends on many variables this will
   * be called many times until all dependencies are in a non loading state.   *
   */
  private onVariableUpdatesCompleted() {
    if (this.isQueryModeAuto()) {
      this.runQueries();
    }
  }

  /**
   * Check if value changed is a adhoc filter o group by variable that did not exist when we issued the last query
   */
  private onAnyVariableChanged(variable: SceneVariable) {
    // If this variable has already been detected this variable as a dependency onVariableUpdatesCompleted above will handle value changes
    if (
      this._drilldownDependenciesManager.adHocFiltersVar === variable ||
      this._drilldownDependenciesManager.groupByVar === variable ||
      !this.isQueryModeAuto()
    ) {
      return;
    }

    if (variable instanceof AdHocFiltersVariable && this._isRelevantAutoVariable(variable)) {
      this.runQueries();
    }

    if (variable instanceof GroupByVariable && this._isRelevantAutoVariable(variable)) {
      this.runQueries();
    }
  }

  private _isRelevantAutoVariable(variable: AdHocFiltersVariable | GroupByVariable) {
    const datasource = this.state.datasource ?? findFirstDatasource(this.state.queries);
    return variable.state.applyMode === 'auto' && datasource?.uid === variable.state.datasource?.uid;
  }

  private shouldRunQueriesOnActivate() {
    if (this._variableValueRecorder.hasDependenciesChanged(this)) {
      writeSceneLog(
        'SceneQueryRunner',
        'Variable dependency changed while inactive, shouldRunQueriesOnActivate returns true'
      );
      return true;
    }

    // If we don't have any data we should run queries
    if (!this.state.data) {
      return true;
    }

    // If time range is stale / different we should run queries
    if (this._isDataTimeRangeStale(this.state.data)) {
      return true;
    }

    return false;
  }

  private _isDataTimeRangeStale(data: PanelData) {
    const timeRange = sceneGraph.getTimeRange(this);

    const stateTimeRange = timeRange.state.value;
    const dataTimeRange = data.timeRange;

    if (
      stateTimeRange.from.unix() === dataTimeRange.from.unix() &&
      stateTimeRange.to.unix() === dataTimeRange.to.unix()
    ) {
      return false;
    }
    writeSceneLog('SceneQueryRunner', 'Data time range is stale');
    return true;
  }

  private _onDeactivate(): void {
    if (this._querySub) {
      this._querySub.unsubscribe();
      this._querySub = undefined;
    }

    if (this._dataLayersSub) {
      this._dataLayersSub.unsubscribe();
      this._dataLayersSub = undefined;
    }

    this._timeSub?.unsubscribe();
    this._timeSub = undefined;
    this._timeSubRange = undefined;

    this._drilldownDependenciesManager.cleanup();
  }

  public setContainerWidth(width: number) {
    // If we don't have a width we should run queries
    if (!this._containerWidth && width > 0) {
      this._containerWidth = width;

      // If we don't have maxDataPoints specifically set and maxDataPointsFromWidth is true
      if (this.state.maxDataPointsFromWidth && !this.state.maxDataPoints) {
        // As this is called from render path we need to wait for next tick before running queries
        setTimeout(() => {
          if (this.isActive && !this.state._hasFetchedData) {
            this.runQueries();
          }
        }, 0);
      }
    } else {
      // if the updated container width is bigger than 0 let's remember the width until next query issue
      if (width > 0) {
        this._containerWidth = width;
      }
    }
  }

  public isDataReadyToDisplay() {
    return Boolean(this.state._hasFetchedData);
  }

  private subscribeToTimeRangeChanges(timeRange: SceneTimeRangeLike) {
    if (this._timeSubRange === timeRange) {
      // Nothing to do, already subscribed
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

  public runQueries() {
    const timeRange = sceneGraph.getTimeRange(this);

    if (this.isQueryModeAuto()) {
      this.subscribeToTimeRangeChanges(timeRange);
    }

    this.runWithTimeRange(timeRange);
  }

  private getMaxDataPoints() {
    if (this.state.maxDataPoints) {
      return this.state.maxDataPoints;
    }

    return this.state.maxDataPointsFromWidth ? this._containerWidth ?? 500 : 500;
  }

  public cancelQuery() {
    this._querySub?.unsubscribe();

    if (this._dataLayersSub) {
      this._dataLayersSub.unsubscribe();
      this._dataLayersSub = undefined;
    }

    this.setState({
      data: { ...this.state.data!, state: LoadingState.Done },
    });
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
    // If no maxDataPoints specified we might need to wait for container width to be set from the outside
    if (!this.state.maxDataPoints && this.state.maxDataPointsFromWidth && !this._containerWidth) {
      return;
    }

    if (this.isQueryModeAuto() && !this._isInView && !this._bypassIsInView) {
      this._queryNotExecutedWhenOutOfView = true;
      return;
    }

    this._queryNotExecutedWhenOutOfView = false;

    // If data layers subscription doesn't exist, create one
    if (!this._dataLayersSub) {
      this._handleDataLayers();
    }

    // Cancel any running queries
    this._querySub?.unsubscribe();

    // Skip executing queries if variable dependency is in loading state
    if (this._variableDependency.hasDependencyInLoadingState()) {
      writeSceneLog('SceneQueryRunner', 'Variable dependency is in loading state, skipping query execution');
      this.setState({ data: { ...(this.state.data ?? emptyPanelData), state: LoadingState.Loading } });
      return;
    }

    this._variableValueRecorder.recordCurrentDependencyValuesForSceneObject(this);

    const { queries } = this.state;

    // Simple path when no queries exist
    if (!queries?.length) {
      this._setNoDataState();
      return;
    }

    try {
      const datasource = this.state.datasource ?? findFirstDatasource(queries);
      const ds = await getDataSource(datasource, this._scopedVars);

      this._drilldownDependenciesManager.findAndSubscribeToDrilldowns(ds.uid);

      const runRequest = getRunRequest();
      const { primary, secondaries, processors } = this.prepareRequests(timeRange, ds);

      writeSceneLog('SceneQueryRunner', 'Starting runRequest', this.state.key);

      let stream = runRequest(ds, primary);

      if (secondaries.length > 0) {
        // Submit all secondary requests in parallel.
        const secondaryStreams = secondaries.map((r) => runRequest(ds, r));
        // Create the rxjs operator which will combine the primary and secondary responses
        // by calling the correct processor functions provided by the
        // extra request providers.
        const op = extraQueryProcessingOperator(processors);
        // Combine the primary and secondary streams into a single stream, and apply the operator.
        stream = forkJoin([stream, ...secondaryStreams]).pipe(op);
      }

      stream = stream.pipe(
        registerQueryWithController({
          type: 'SceneQueryRunner/runQueries',
          request: primary,
          origin: this,
          cancel: () => this.cancelQuery(),
        })
      );

      this._querySub = stream.subscribe(this.onDataReceived);
    } catch (err) {
      console.error('PanelQueryRunner Error', err);

      this.onDataReceived({
        ...emptyPanelData,
        ...this.state.data,
        state: LoadingState.Error,
        errors: [toDataQueryError(err)],
      });
    }
  }

  public clone(withState?: Partial<QueryRunnerState>) {
    const clone = super.clone(withState);

    if (this._resultAnnotations) {
      clone['_resultAnnotations'] = this._resultAnnotations.map((frame) => ({ ...frame }));
    }

    if (this._layerAnnotations) {
      clone['_layerAnnotations'] = this._layerAnnotations.map((frame) => ({ ...frame }));
    }

    clone['_variableValueRecorder'] = this._variableValueRecorder.cloneAndRecordCurrentValuesForSceneObject(this);
    clone['_containerWidth'] = this._containerWidth;
    clone['_results'].next({ origin: this, data: this.state.data ?? emptyPanelData });

    return clone;
  }

  private prepareRequests(timeRange: SceneTimeRangeLike, ds: DataSourceApi): PreparedRequests {
    const { minInterval, queries } = this.state;

    let request: DataQueryRequest<DataQueryExtended> = {
      app: 'scenes',
      requestId: getNextRequestId(),
      timezone: timeRange.getTimeZone(),
      range: timeRange.state.value,
      interval: '1s',
      intervalMs: 1000,
      targets: cloneDeep(queries),
      maxDataPoints: this.getMaxDataPoints(),
      scopedVars: this._scopedVars,
      startTime: Date.now(),
      liveStreaming: this.state.liveStreaming,
      rangeRaw: {
        from: timeRange.state.from,
        to: timeRange.state.to,
      },
      cacheTimeout: this.state.cacheTimeout,
      queryCachingTTL: this.state.queryCachingTTL,
      scopes: sceneGraph.getScopes(this),
      // This asks the scene root to provide context properties like app, panel and dashboardUID
      ...getEnrichedDataRequest(this),
    };

    const filters = this._drilldownDependenciesManager.getFilters();
    const groupByKeys = this._drilldownDependenciesManager.getGroupByKeys();

    if (filters) {
      request.filters = filters;
    }

    if (groupByKeys) {
      request.groupByKeys = groupByKeys;
    }

    request.targets = request.targets.map((query) => {
      if (
        !query.datasource ||
        (query.datasource.uid !== ds.uid &&
          !ds.meta?.mixed &&
          isExpressionReference /* TODO: Remove this check when isExpressionReference is properly exported from grafan runtime */ &&
          !isExpressionReference(query.datasource))
      ) {
        query.datasource = ds.getRef();
      }
      return query;
    });

    const lowerIntervalLimit = minInterval ? interpolate(this, minInterval) : ds.interval;
    const norm = rangeUtil.calculateInterval(timeRange.state.value, request.maxDataPoints!, lowerIntervalLimit);

    // make shallow copy of scoped vars,
    // and add built in variables interval and interval_ms
    request.scopedVars = Object.assign({}, request.scopedVars, {
      __interval: { text: norm.interval, value: norm.interval },
      __interval_ms: { text: norm.intervalMs.toString(), value: norm.intervalMs },
    });

    request.interval = norm.interval;
    request.intervalMs = norm.intervalMs;

    // If there are any extra request providers, we need to add a new request for each
    // and map the request's ID to the processor function given by the provider, to ensure that
    // the processor is called with the correct response data.
    const primaryTimeRange = timeRange.state.value;
    let secondaryRequests: DataQueryRequest[] = [];
    let secondaryProcessors = new Map();
    for (const provider of this.getClosestExtraQueryProviders() ?? []) {
      for (const { req, processor } of provider.getExtraQueries(request)) {
        const requestId = getNextRequestId();
        secondaryRequests.push({ ...req, requestId });
        secondaryProcessors.set(requestId, processor ?? passthroughProcessor);
      }
    }
    request.range = primaryTimeRange;
    return { primary: request, secondaries: secondaryRequests, processors: secondaryProcessors };
  }

  private onDataReceived = (data: PanelData) => {
    // Will combine annotations from SQR queries (frames with meta.dataTopic === DataTopic.Annotations)
    const preProcessedData = preProcessPanelData(data, this.state.data);

    // Save query annotations
    this._resultAnnotations = data.annotations;

    // Will combine annotations & alert state from data layer providers
    const dataWithLayersApplied = this._combineDataLayers(preProcessedData);

    let hasFetchedData = this.state._hasFetchedData;

    if (!hasFetchedData && preProcessedData.state !== LoadingState.Loading) {
      hasFetchedData = true;
    }

    this.setState({ data: dataWithLayersApplied, _hasFetchedData: hasFetchedData });
    this._results.next({ origin: this, data: dataWithLayersApplied });
  };

  private _combineDataLayers(data: PanelData) {
    if (this._layerAnnotations && this._layerAnnotations.length > 0) {
      data.annotations = (data.annotations || []).concat(this._layerAnnotations);
    }

    if (this.state.data && this.state.data.alertState) {
      data.alertState = this.state.data.alertState;
    }

    return data;
  }

  private _setNoDataState() {
    if (this.state.data !== emptyPanelData) {
      this.setState({ data: emptyPanelData });
    }
  }

  /**
   * Walk up the scene graph and find any ExtraQueryProviders.
   *
   * This will return an array of the closest provider of each type.
   */
  private getClosestExtraQueryProviders(): Array<ExtraQueryProvider<any>> {
    // Maintain a map from provider constructor to provider object. The constructor
    // is used as a unique key for each class, to ensure we have no more than one
    // type of each type of provider.
    const found = new Map();
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
      // Always return null so that the search continues to the top of
      // the scene graph.
      return null;
    });
    return Array.from(found.values());
  }

  private isQueryModeAuto(): boolean {
    return (this.state.runQueriesMode ?? 'auto') === 'auto';
  }

  public isInViewChanged(isInView: boolean): void {
    writeSceneLog('SceneQueryRunner', `isInViewChanged: ${isInView}`, this.state.key);
    this._isInView = isInView;

    if (isInView && this._queryNotExecutedWhenOutOfView) {
      this.runQueries();
    }
  }

  public bypassIsInViewChanged(bypassIsInView: boolean): void {
    writeSceneLog('SceneQueryRunner', `bypassIsInViewChanged: ${bypassIsInView}`, this.state.key);
    this._bypassIsInView = bypassIsInView;

    if (bypassIsInView && this._queryNotExecutedWhenOutOfView) {
      this.runQueries();
    }
  }
}

export function findFirstDatasource(targets: DataQuery[]): DataSourceRef | undefined {
  return targets.find((t) => t.datasource !== null)?.datasource ?? undefined;
}

function allFramesEmpty(frames?: DataFrame[]) {
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
