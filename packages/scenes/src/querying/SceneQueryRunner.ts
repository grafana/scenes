import { cloneDeep } from 'lodash';
import { forkJoin, Unsubscribable } from 'rxjs';

import { DataQuery, DataSourceRef, LoadingState } from '@grafana/schema';

import {
  CoreApp,
  DataQueryRequest,
  DataSourceApi,
  FieldType,
  PanelData,
  preProcessPanelData,
  rangeUtil,
  ScopedVar,
} from '@grafana/data';
import { getRunRequest } from '@grafana/runtime';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneDataProvider, SceneObject, SceneObjectState, SceneTimeRangeLike } from '../core/types';
import { getDataSource } from '../utils/getDataSource';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneVariable } from '../variables/types';
import { getCompareSeriesRefId } from '../utils/getCompareSeriesRefId';
import { writeSceneLog } from '../utils/writeSceneLog';
import { VariableValueRecorder } from '../variables/VariableValueRecorder';
import { emptyPanelData } from '../core/SceneDataNode';
import { isTimeRangeCompareProvider, SceneTimeRangeCompare } from '../components/SceneTimeRangeCompare';

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
  // Non persisted state
  maxDataPointsFromWidth?: boolean;
  isWaitingForVariables?: boolean;
}

export interface DataQueryExtended extends DataQuery {
  [key: string]: any;
}

export class SceneQueryRunner extends SceneObjectBase<QueryRunnerState> implements SceneDataProvider {
  private _querySub?: Unsubscribable;
  private _containerWidth?: number;
  private _variableValueRecorder = new VariableValueRecorder();
  private _hasFetchedData = false;

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
    const comparer = getTimeCompare(this);

    this._subs.add(
      timeRange.subscribeToState(() => {
        this.runWithTimeRange(timeRange);
      })
    );

    if (comparer) {
      this._subs.add(
        comparer.subscribeToState(() => {
          this.runQueries();
        })
      );
    }
    if (this.shouldRunQueriesOnActivate()) {
      this.runQueries();
    }

    return () => this._onDeactivate();
  }

  /**
   * Handles some tricky cases where we need to run queries even when they have not changed in case
   * the query execution on activate was stopped due to VariableSet still not having processed all variables.
   */
  private onVariableUpdatesCompleted(_variablesThatHaveChanged: Set<SceneVariable>, dependencyChanged: boolean) {
    if (this.state.isWaitingForVariables && this.shouldRunQueriesOnActivate()) {
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
    return this._hasFetchedData;
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
      this.setState({ isWaitingForVariables: true });
      return;
    }

    // If we were waiting for variables, clear that flag
    if (this.state.isWaitingForVariables) {
      this.setState({ isWaitingForVariables: false });
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
        const diff = secondaryRequest.range.from.diff(request.range.from);

        this._querySub = forkJoin([runRequest(ds, request), runRequest(ds, secondaryRequest)]).subscribe(([p, s]) => {
          s.series.forEach((series) => {
            series.refId = getCompareSeriesRefId(series.refId || '');
            series.meta = {
              ...series.meta,
              // @ts-ignore Remove when https://github.com/grafana/grafana/pull/71129 is released
              timeCompare: {
                diffMs: diff,
                isTimeShiftQuery: true,
              },
            };
            series.fields.forEach((field) => {
              // Align compare series time stamps with reference series
              if (field.type === FieldType.time) {
                field.values = field.values.map((v) => {
                  return diff < 0 ? v - diff : v + diff;
                });
              }
              return field;
            });
          });

          this.onDataReceived({
            ...p,
            series: [...p.series, ...s.series],
          });
        });
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
    const comparer = getTimeCompare(this);
    const { minInterval, queries } = this.state;
    const sceneObjectScopedVar: Record<string, ScopedVar<SceneQueryRunner>> = {
      __sceneObject: { text: '__sceneObject', value: this },
    };

    let secondaryRequest: DataQueryRequest | undefined;

    let request: DataQueryRequest = {
      app: CoreApp.Dashboard,
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
    const preProcessedData = preProcessPanelData(data, this.state.data);
    if (!this._hasFetchedData && preProcessedData.state !== LoadingState.Loading) {
      this._hasFetchedData = true;
    }

    this.setState({ data: preProcessedData });
  };

  private _setNoDataState() {
    if (this.state.data !== emptyPanelData) {
      this.setState({ data: emptyPanelData });
    }
  }
}

export function findFirstDatasource(targets: DataQuery[]): DataSourceRef | undefined {
  return targets.find((t) => t.datasource !== null)?.datasource ?? undefined;
}

/**
 * Will walk up the scene graph and find the closest time range compare object
 */
function getTimeCompare(sceneObject: SceneObject): SceneTimeRangeCompare | null {
  let comparer;
  sceneObject.forEachChild((child) => {
    if (isTimeRangeCompareProvider(child)) {
      comparer = child;
    }
  });
  if (comparer) {
    return comparer;
  }
  if (sceneObject.parent) {
    return getTimeCompare(sceneObject.parent);
  }
  return null;
}
