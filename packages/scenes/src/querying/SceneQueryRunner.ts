import { cloneDeep } from 'lodash';
import { forkJoin, map, merge, mergeAll, Observable, ReplaySubject, Unsubscribable } from 'rxjs';

import { DataQuery, DataSourceRef, LoadingState } from '@grafana/schema';

import {
  DataFrame,
  DataQueryRequest,
  DataSourceApi,
  PanelData,
  preProcessPanelData,
  rangeUtil,
  ScopedVar,
} from '@grafana/data';
import { getRunRequest } from '@grafana/runtime';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import {
  isDataRequestEnricher,
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
  // Private runtime state
  _isWaitingForVariables?: boolean;
  _hasFetchedData?: boolean;
}

export interface DataQueryExtended extends DataQuery {
  [key: string]: any;
}

export class SceneQueryRunner extends SceneObjectBase<QueryRunnerState> implements SceneDataProvider {
  private _querySub?: Unsubscribable;
  private _containerWidth?: number;
  private _variableValueRecorder = new VariableValueRecorder();
  private _results = new ReplaySubject<SceneDataProviderResult>();

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

    this._handleDataLayers();

    return () => this._onDeactivate();
  }

  // This method subscribes to all SceneDataLayers up until the root, and combines the results into data provided from SceneQueryRunner
  private _handleDataLayers() {
    const dataLayers = sceneGraph.getDataLayers(this);

    const observables: Array<Observable<SceneDataProviderResult>> = [];

    // This keeps track of multiple SceneDataLayers. The key responsibility od this map is to make sure individual from independent SceneDataLayers do not overwrite each other.
    const resultsMap: Map<string, PanelData> = new Map();

    if (dataLayers.length > 0) {
      dataLayers.forEach((layer) => {
        observables.push(layer.getResultsStream());
      });

      // possibly we want to combine the results from all layers and only then update, but this is tricky ;(
      this._subs.add(
        merge(observables)
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
          })
      );
    }
  }

  private _onLayersReceived(results: Map<string, PanelData>) {
    let annotations: DataFrame[] = [];

    Array.from(results.values()).forEach((result) => {
      if (result.annotations) {
        annotations = annotations.concat(result.annotations);
      }
    });

    this.setState({
      data: {
        ...this.state.data!,
        annotations,
      },
    });
  }

  /**
   * Handles some tricky cases where we need to run queries even when they have not changed in case
   * the query execution on activate was stopped due to VariableSet still not having processed all variables.
   */
  private onVariableUpdatesCompleted(_variablesThatHaveChanged: Set<SceneVariable>, dependencyChanged: boolean) {
    if (this.state._isWaitingForVariables && this.shouldRunQueriesOnActivate()) {
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

    if (data.timeRange === timeRange.state.value) {
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

    const dataLayers = sceneGraph.getDataLayers(this);
    dataLayers.forEach((layer) => {
      layer.cancelQuery?.();
    });

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
          if (this.isActive && !this._querySub) {
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

    const dataLayers = sceneGraph.getDataLayers(this);
    dataLayers.forEach((layer) => {
      layer.cancelQuery?.();
    });

    this.setState({
      data: { ...this.state.data!, state: LoadingState.Done },
    });
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
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
    const sceneObjectScopedVar: Record<string, ScopedVar<SceneQueryRunner>> = {
      __sceneObject: { text: '__sceneObject', value: this },
    };

    // Simple path when no queries exist
    if (!queries?.length) {
      this._setNoDataState();
      return;
    }

    try {
      const datasource = this.state.datasource ?? findFirstDatasource(queries);
      const ds = await getDataSource(datasource, sceneObjectScopedVar);

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
    } catch (err) {
      console.error('PanelQueryRunner Error', err);
    }
  }

  private prepareRequests = (
    timeRange: SceneTimeRangeLike,
    ds: DataSourceApi
  ): [DataQueryRequest, DataQueryRequest | undefined] => {
    const comparer = this.getTimeCompare();
    const { minInterval, queries } = this.state;
    const sceneObjectScopedVar: Record<string, ScopedVar<SceneQueryRunner>> = {
      __sceneObject: { text: '__sceneObject', value: this },
    };

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
      scopedVars: sceneObjectScopedVar,
      startTime: Date.now(),
      liveStreaming: this.state.liveStreaming,
      rangeRaw: {
        from: timeRange.state.from,
        to: timeRange.state.to,
      },
      // This asks the scene root to provide context properties like app, panel and dashboardUID
      ...getEnrichedDataRequest(this),
    };

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

    // Will combine annotations from SQR queries (frames with meta.dataTopic === DataTopic.Annotations)
    const preProcessedData = preProcessPanelData(data, this.state.data);

    // Will combine annotations & --- from data layer providers
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
}

export function findFirstDatasource(targets: DataQuery[]): DataSourceRef | undefined {
  return targets.find((t) => t.datasource !== null)?.datasource ?? undefined;
}

function getEnrichedDataRequest(sourceRunner: SceneQueryRunner): Partial<DataQueryRequest> | null {
  const root = sourceRunner.getRoot();

  if (isDataRequestEnricher(root)) {
    return root.enrichDataRequest(sourceRunner);
  }

  return null;
}
