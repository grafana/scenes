import { cloneDeep } from 'lodash';
import { mergeMap, MonoTypeOperatorFunction, Unsubscribable, map, of } from 'rxjs';

import {
  CoreApp,
  DataQuery,
  DataQueryRequest,
  DataSourceRef,
  DataTransformerConfig,
  PanelData,
  rangeUtil,
  ScopedVar,
  TimeRange,
  transformDataFrame,
} from '@grafana/data';
import { getRunRequest } from '@grafana/runtime';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObject, SceneObjectStatePlain } from '../core/types';
import { getDataSource } from '../utils/getDataSource';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { VariableValue } from '../variables/types';

let counter = 100;

export function getNextRequestId() {
  return 'QS' + counter++;
}

export interface QueryRunnerState extends SceneObjectStatePlain {
  data?: PanelData;
  queries: DataQueryExtended[];
  transformations?: DataTransformerConfig[];
  datasource?: DataSourceRef;
  minInterval?: string;
  maxDataPoints?: number;
  // Non persisted state
  maxDataPointsFromWidth?: boolean;
}

export interface DataQueryExtended extends DataQuery {
  [key: string]: any;
}

export class SceneQueryRunner extends SceneObjectBase<QueryRunnerState> {
  private _querySub?: Unsubscribable;
  private _containerWidth?: number;
  // Map of variable values used for performing last run
  private _lastRunVariables = new Map<string, VariableValue | undefined | null>();

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['queries', 'datasource'],
    onReferencedVariableValueChanged: () => this.runQueries(),
  });

  public activate() {
    super.activate();
    const timeRange = sceneGraph.getTimeRange(this);

    this._subs.add(
      timeRange.subscribeToState({
        next: (timeRange) => {
          this.runWithTimeRange(timeRange.value);
        },
      })
    );

    if (this.shouldRunQueriesOnActivate()) {
      this.runQueries();
    }
  }

  private shouldRunQueriesOnActivate() {
    // Check if variables have changed since last run.
    // This is relevant in case variable values are applied via URL sync that happened before activation.
    // In such scenerio no objects are notified about variables change, hence queries would not be run.
    // TODO validate that time range is similar and if not we should run queries again
    if (!areMapsEqual(this._lastRunVariables, this.getCurrentVariables())) {
      return true;
    }

    // If we already have data, no need
    if (this.state.data) {
      return false;
    }

    // If no maxDataPoints specified we need might to wait for container width to be set from the outside
    if (!this.state.maxDataPoints && this.state.maxDataPointsFromWidth && !this._containerWidth) {
      return false;
    }

    return true;
  }

  public deactivate(): void {
    super.deactivate();

    if (this._querySub) {
      this._querySub.unsubscribe();
      this._querySub = undefined;
    }
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

  public runQueries() {
    const timeRange = sceneGraph.getTimeRange(this);

    this.runWithTimeRange(timeRange.state.value);
  }

  private getMaxDataPoints() {
    return this.state.maxDataPoints ?? this._containerWidth ?? 500;
  }

  private async runWithTimeRange(timeRange: TimeRange) {
    // Persist values of variables used for last run
    const variables = sceneGraph.getVariables(this);
    this._variableDependency.getNames().forEach((name) => {
      const value = variables.getByName(name)?.getValue();
      this._lastRunVariables.set(name, value);
    });

    const { datasource, minInterval, queries } = this.state;

    const sceneObjectScopedVar: Record<string, ScopedVar<SceneQueryRunner>> = {
      __sceneObject: { text: '__sceneObject', value: this },
    };
    const request: DataQueryRequest = {
      app: CoreApp.Dashboard,
      requestId: getNextRequestId(),
      timezone: 'browser',
      panelId: 1,
      dashboardId: 1,
      range: timeRange,
      interval: '1s',
      intervalMs: 1000,
      targets: cloneDeep(queries),
      maxDataPoints: this.getMaxDataPoints(),
      scopedVars: sceneObjectScopedVar,
      startTime: Date.now(),
    };

    try {
      const ds = await getDataSource(datasource, request.scopedVars);
      // Attach the data source name to each query
      request.targets = request.targets.map((query) => {
        if (!query.datasource) {
          query.datasource = ds.getRef();
        }
        return query;
      });

      // TODO interpolate minInterval
      const lowerIntervalLimit = minInterval ? minInterval : ds.interval;
      const norm = rangeUtil.calculateInterval(timeRange, request.maxDataPoints!, lowerIntervalLimit);

      // make shallow copy of scoped vars,
      // and add built in variables interval and interval_ms
      request.scopedVars = Object.assign({}, request.scopedVars, {
        __interval: { text: norm.interval, value: norm.interval },
        __interval_ms: { text: norm.intervalMs.toString(), value: norm.intervalMs },
      });

      request.interval = norm.interval;
      request.intervalMs = norm.intervalMs;

      const runRequest = getRunRequest();
      this._querySub = runRequest(ds, request)
        .pipe(getTransformationsStream(this, this.state.transformations))
        .subscribe({
          next: this.onDataReceived,
        });
    } catch (err) {
      console.error('PanelQueryRunner Error', err);
    }
  }

  private onDataReceived = (data: PanelData) => {
    this.setState({ data });
  };

  private getCurrentVariables() {
    const currentVars = new Map<string, VariableValue | undefined | null>();
    const variables = sceneGraph.getVariables(this);

    this._variableDependency.getNames().forEach((name) => {
      const value = variables.getByName(name)?.getValue();
      currentVars.set(name, value);
    });

    return currentVars;
  }
}

export const getTransformationsStream: (
  sceneObject: SceneObject,
  transformations?: DataTransformerConfig[]
) => MonoTypeOperatorFunction<PanelData> = (sceneObject, transformations) => (inputStream) => {
  return inputStream.pipe(
    mergeMap((data) => {
      if (!transformations || transformations.length === 0) {
        return of(data);
      }

      const ctx = {
        interpolate: (value: string) => {
          return sceneGraph.interpolate(sceneObject, value, data?.request?.scopedVars);
        },
      };

      return transformDataFrame(transformations, data.series, ctx).pipe(map((series) => ({ ...data, series })));
    })
  );
};

function areMapsEqual(
  m1: Map<string, VariableValue | undefined | null>,
  m2: Map<string, VariableValue | undefined | null>
) {
  return m1.size === m2.size && Array.from(m1.keys()).every((key) => m1.get(key) === m2.get(key));
}
