import { cloneDeep } from 'lodash';
import { forkJoin, map, merge, mergeAll, Observable, ReplaySubject, Unsubscribable } from 'rxjs';

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
import { getRunRequest, toDataQueryError } from '@grafana/runtime';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import {
  DataLayerFilter,
  SceneDataLayerProviderResult,
  SceneDataProvider,
  SceneDataProviderResult,
  SceneObjectState,
  SceneTimeRangeLike,
} from '../core/types';
import { getDataSource } from '../utils/getDataSource';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneVariable } from '../variables/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { VariableValueRecorder } from '../variables/VariableValueRecorder';
import { emptyPanelData } from '../core/SceneDataNode';
import { SceneTimeRangeCompare } from '../components/SceneTimeRangeCompare';
import { getClosest } from '../core/sceneGraph/utils';
import { timeShiftQueryResponseOperator } from './timeShiftQueryResponseOperator';
import { filterAnnotations } from './layers/annotations/filterAnnotations';
import { getEnrichedDataRequest } from './getEnrichedDataRequest';
import { AdHocFilterSet } from '../variables/adhoc/AdHocFiltersSet';
import { findActiveAdHocFilterSetByUid } from '../variables/adhoc/patchGetAdhocFilters';
import { SceneQueryControllerLike } from './SceneQueryController';

let counter = 100;

export function getNextRequestId() {
  return 'SQR' + counter++;
}

export interface QueryRunnerState extends SceneObjectState {
  data?: PanelData;
  queries: DataQueryExtended[];
  datasource?: DataSourceRef;
  minInterval?: string;
  maxDataPoints?: number;
  liveStreaming?: boolean;
  maxDataPointsFromWidth?: boolean;
  // Filters to be applied to data layer results before combining them with SQR results
  dataLayerFilter?: DataLayerFilter;
  // Private runtime state
  _isWaitingForVariables?: boolean;
  _hasFetchedData?: boolean;
}

export interface DataQueryExtended extends DataQuery {
  [key: string]: any;
}

export class SceneQueryRunner extends SceneObjectBase<QueryRunnerState> implements SceneDataProvider {
  private _querySub?: Unsubscribable;
  private _signalQueryCompleted?: () => void;
  private _dataLayersSub?: Unsubscribable;
  private _containerWidth?: number;
  private _variableValueRecorder = new VariableValueRecorder();
  private _results = new ReplaySubject<SceneDataProviderResult>();
  private _scopedVars = { __sceneObject: { value: this, text: '__sceneObject' } };
  private _queryController?: SceneQueryControllerLike;

  // Closest filter set if found)
  private _adhocFilterSet?: AdHocFilterSet;
  private _adhocFilterSub?: Unsubscribable;

  public getResultsStream() {
    return this._results;
  }

  protected _variableDependency: VariableDependencyConfig<QueryRunnerState> = new VariableDependencyConfig(this, {
    statePaths: ['queries', 'datasource'],
    onVariableUpdatesCompleted: (variables, dependencyChanged) =>
      this.onVariableUpdatesCompleted(variables, dependencyChanged),
  });

  public constructor(initialState: QueryRunnerState) {
    super(initialState);

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    const timeRange = sceneGraph.getTimeRange(this);
    const comparer = this.getTimeCompare();

    this._queryController = sceneGraph.getQueryController(this);

    if (comparer) {
      this._subs.add(
        comparer.subscribeToState((n, p) => {
          if (n.compareWith !== p.compareWith) {
            this.runQueries();
          }
        })
      );
    }

    this._subs.add(
      timeRange.subscribeToState(() => {
        this.runWithTimeRange(timeRange);
      })
    );

    if (this.shouldRunQueriesOnActivate()) {
      this.runQueries();
    }

    return () => this._onDeactivate();
  }

  // This method subscribes to all SceneDataLayers up until the root, and combines the results into data provided from SceneQueryRunner
  private _handleDataLayers() {
    const dataLayers = sceneGraph.getDataLayers(this);

    const observables: Array<Observable<SceneDataLayerProviderResult>> = [];

    // This keeps track of multiple SceneDataLayers. The key responsibility od this map is to make sure individual from independent SceneDataLayers do not overwrite each other.
    const resultsMap: Map<string, PanelData> = new Map();

    if (dataLayers.length > 0) {
      dataLayers.forEach((layer) => {
        observables.push(layer.getResultsStream());
      });

      // possibly we want to combine the results from all layers and only then update, but this is tricky ;(
      this._dataLayersSub = merge(observables)
        .pipe(
          mergeAll(),
          map((v) => {
            // Is there a better, rxjs only way to combine multiple same-data-topic observables?
            // Indexing by origin state key is to make sure we do not duplicate/overwrite data from the different origins
            resultsMap.set(v.origin.state.key!, v.data);
            return resultsMap;
          })
        )
        .subscribe((result) => {
          this._onLayersReceived(result);
        });
    }
  }

  private _onLayersReceived(results: Map<string, PanelData>) {
    const timeRange = sceneGraph.getTimeRange(this);
    const dataLayers = sceneGraph.getDataLayers(this);
    const { dataLayerFilter } = this.state;
    let annotations: DataFrame[] = [];
    let alertStates: DataFrame[] = [];
    let alertState: AlertStateInfo | undefined;
    const layerKeys = Array.from(results.keys());

    Array.from(results.values()).forEach((result, i) => {
      const layerKey = layerKeys[i];
      const layer = dataLayers.find((l) => l.state.key === layerKey);
      if (layer) {
        if (layer.topic === DataTopic.Annotations && result[DataTopic.Annotations]) {
          annotations = annotations.concat(result[DataTopic.Annotations]);
        }

        // @ts-expect-error TODO: use DataTopic.AlertStates when exposed from core grafana
        if (layer.topic === 'alertStates') {
          alertStates = alertStates.concat(result.series);
        }
      }
    });

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

    const baseStateUpdate = this.state.data ? this.state.data : { ...emptyPanelData, timeRange: timeRange.state.value };

    this.setState({
      data: {
        ...baseStateUpdate,
        annotations,
        alertState: alertState ?? this.state.data?.alertState,
      },
    });
  }

  /**
   * Handles some tricky cases where we need to run queries even when they have not changed in case
   * the query execution on activate was stopped due to VariableSet still not having processed all variables.
   */
  private onVariableUpdatesCompleted(_variablesThatHaveChanged: Set<SceneVariable>, dependencyChanged: boolean) {
    if (this.state._isWaitingForVariables) {
      this.runQueries();
      return;
    }

    if (dependencyChanged) {
      this.runQueries();
    }
  }

  private shouldRunQueriesOnActivate() {
    // If no maxDataPoints specified we might need to wait for container width to be set from the outside
    if (!this.state.maxDataPoints && this.state.maxDataPointsFromWidth && !this._containerWidth) {
      return false;
    }

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

    if (this._adhocFilterSub) {
      this._adhocFilterSub.unsubscribe();
    }

    this._variableValueRecorder.recordCurrentDependencyValuesForSceneObject(this);
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

  public runQueries() {
    const timeRange = sceneGraph.getTimeRange(this);
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

    if (this._signalQueryCompleted) {
      this._signalQueryCompleted();
      this._signalQueryCompleted = undefined;
    }

    this.setState({
      data: { ...this.state.data!, state: LoadingState.Done },
    });
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
    // If data layers subscription doesn't exist, create one
    if (!this._dataLayersSub) {
      this._handleDataLayers();
    }

    const runRequest = getRunRequest();

    // Cancel any running queries
    this._querySub?.unsubscribe();

    // Skip executing queries if variable dependency is in loading state
    if (sceneGraph.hasVariableDependencyInLoadingState(this)) {
      writeSceneLog('SceneQueryRunner', 'Variable dependency is in loading state, skipping query execution');
      this.setState({ _isWaitingForVariables: true });
      return;
    }

    // If we were waiting for variables, clear that flag
    if (this.state._isWaitingForVariables) {
      this.setState({ _isWaitingForVariables: false });
    }

    const { queries } = this.state;

    // Simple path when no queries exist
    if (!queries?.length) {
      this._setNoDataState();
      return;
    }

    try {
      const datasource = this.state.datasource ?? findFirstDatasource(queries);
      const ds = await getDataSource(datasource, this._scopedVars);

      if (!this._adhocFilterSet) {
        this.findAndSubscribeToAdhocFilters(datasource?.uid);
      }

      const [request, secondaryRequest] = this.prepareRequests(timeRange, ds);

      writeSceneLog('SceneQueryRunner', 'Starting runRequest', this.state.key);

      if (secondaryRequest) {
        // change subscribe callback below to pipe operator
        this._querySub = forkJoin([runRequest(ds, request), runRequest(ds, secondaryRequest)])
          .pipe(timeShiftQueryResponseOperator)
          .subscribe(this.onDataReceived);
      } else {
        this._querySub = runRequest(ds, request).subscribe(this.onDataReceived);
      }

      if (this._queryController) {
        this._signalQueryCompleted = this._queryController.queryStarted({
          type: 'data',
          query: request,
          source: this,
          cancel: () => this.cancelQuery(),
        });
      }
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

  private prepareRequests = (
    timeRange: SceneTimeRangeLike,
    ds: DataSourceApi
  ): [DataQueryRequest, DataQueryRequest | undefined] => {
    const comparer = this.getTimeCompare();
    const { minInterval, queries } = this.state;

    let secondaryRequest: DataQueryRequest | undefined;

    let request: DataQueryRequest = {
      app: 'scenes',
      requestId: getNextRequestId(),
      timezone: timeRange.getTimeZone(),
      panelId: 1,
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
      // This asks the scene root to provide context properties like app, panel and dashboardUID
      ...getEnrichedDataRequest(this),
    };

    if (this._adhocFilterSet) {
      // @ts-ignore (Temporary ignore until we update @grafana/data)
      request.filters = this._adhocFilterSet.state.filters;
    }

    request.targets = request.targets.map((query) => {
      if (!query.datasource) {
        query.datasource = ds.getRef();
      }
      return query;
    });

    // TODO interpolate minInterval
    const lowerIntervalLimit = minInterval ? minInterval : ds.interval;
    const norm = rangeUtil.calculateInterval(timeRange.state.value, request.maxDataPoints!, lowerIntervalLimit);

    // make shallow copy of scoped vars,
    // and add built in variables interval and interval_ms
    request.scopedVars = Object.assign({}, request.scopedVars, {
      __interval: { text: norm.interval, value: norm.interval },
      __interval_ms: { text: norm.intervalMs.toString(), value: norm.intervalMs },
    });

    request.interval = norm.interval;
    request.intervalMs = norm.intervalMs;

    const primaryTimeRange = timeRange.state.value;
    if (comparer) {
      const secondaryTimeRange = comparer.getCompareTimeRange(primaryTimeRange);
      if (secondaryTimeRange) {
        secondaryRequest = {
          ...request,
          range: secondaryTimeRange,
          requestId: getNextRequestId(),
        };

        request = {
          ...request,
          range: primaryTimeRange,
        };
      }
    }

    return [request, secondaryRequest];
  };

  private onDataReceived = (data: PanelData) => {
    this._results.next({ origin: this, data });

    if (data.state !== LoadingState.Loading) {
      if (this._signalQueryCompleted) {
        this._signalQueryCompleted();
      }
    }

    // Will combine annotations from SQR queries (frames with meta.dataTopic === DataTopic.Annotations)
    const preProcessedData = preProcessPanelData(data, this.state.data);

    // Will combine annotations & alert state from data layer providers
    const dataWithLayersApplied = this._combineDataLayers(preProcessedData);

    let hasFetchedData = this.state._hasFetchedData;

    if (!hasFetchedData && preProcessedData.state !== LoadingState.Loading) {
      hasFetchedData = true;
    }

    this.setState({ data: dataWithLayersApplied, _hasFetchedData: hasFetchedData });
  };

  private _combineDataLayers(data: PanelData) {
    if (this.state.data && this.state.data.annotations) {
      data.annotations = (data.annotations || []).concat(this.state.data.annotations);
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
   * Will walk up the scene graph and find the closest time range compare object
   * It performs buttom-up search, including shallow search across object children for supporting controls/header actions
   */
  private getTimeCompare() {
    if (!this.parent) {
      return null;
    }
    return getClosest(this.parent, (s) => {
      let found = null;
      if (s instanceof SceneTimeRangeCompare) {
        return s;
      }
      s.forEachChild((child) => {
        if (child instanceof SceneTimeRangeCompare) {
          found = child;
        }
      });

      return found;
    });
  }

  /**
   * Walk up scene graph and find the closest filterset with matching data source
   */
  private findAndSubscribeToAdhocFilters(uid: string | undefined) {
    const set = findActiveAdHocFilterSetByUid(uid);

    if (!set || set.state.applyMode !== 'same-datasource') {
      return;
    }

    // Subscribe to filter set state changes so that queries are re-issued when it changes
    this._adhocFilterSet = set;
    this._adhocFilterSub = this._adhocFilterSet?.subscribeToState(() => this.runQueries());
  }
}

export function findFirstDatasource(targets: DataQuery[]): DataSourceRef | undefined {
  return targets.find((t) => t.datasource !== null)?.datasource ?? undefined;
}
