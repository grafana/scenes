import { mergeMap, Unsubscribable, map, from, merge, ReplaySubject, mergeAll, reduce, Observable } from 'rxjs';

import { AnnotationQuery, DataQuery, DataSourceRef } from '@grafana/schema';

import { TimeRange } from '@grafana/data';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneDataProvider, SceneObjectState } from '../core/types';
import { getDataSource } from '../utils/getDataSource';
import { executeAnnotationQuery } from './executeAnnotationQuery';
import { AnnotationQueryResult } from './types';

let counter = 100;

export function getNextRequestId() {
  return 'SQR' + counter++;
}

export interface AnnotationsQueryRunnerState extends SceneObjectState {
  queries: AnnotationQuery[];
  data?: any;
}

export class AnnotationsQueryRunner extends SceneObjectBase<AnnotationsQueryRunnerState> implements SceneDataProvider {
  private _querySub?: Unsubscribable;
  private _results = new ReplaySubject<AnnotationQueryResult>();

  public constructor(initialState: AnnotationsQueryRunnerState) {
    super(initialState);

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    const timeRange = sceneGraph.getTimeRange(this);

    this._subs.add(
      timeRange.subscribeToState((timeRange) => {
        this.runWithTimeRange(timeRange.value);
      })
    );

    if (this.shouldRunQueriesOnActivate()) {
      this.runQueries();
    }

    return () => this._onDeactivate();
  }

  private shouldRunQueriesOnActivate() {
    if (this.state.data) {
      return false;
    }

    return true;
  }

  private _onDeactivate(): void {
    if (this._querySub) {
      this._querySub.unsubscribe();
      this._querySub = undefined;
    }
  }

  public runQueries() {
    const timeRange = sceneGraph.getTimeRange(this);
    this.runWithTimeRange(timeRange.state.value);
  }

  private async runWithTimeRange(timeRange: TimeRange) {
    const { queries } = this.state;

    // Simple path when no queries exist
    if (!queries?.length) {
      // TODO set empty state
      return;
    }

    const observables = queries.map((query) => {
      // TODO pass scopedVars
      return from(getDataSource(query.datasource ?? null, {})).pipe(
        mergeMap((ds) => executeAnnotationQuery(ds, timeRange, query)),
        map((data) => {
          const result: AnnotationQueryResult = {
            annotations: data.events ?? [],
            alertStates: [],
          };
          return result;
        })
      );
    });

    this._querySub = merge(observables)
      .pipe(
        mergeAll(),
        reduce((acc: AnnotationQueryResult, value: AnnotationQueryResult) => {
          // console.log({ acc: acc.annotations.length, value: value.annotations.length });
          // should we use scan or reduce here
          // reduce will only emit when all observables are completed
          // scan will emit when any observable is completed
          // choosing reduce to minimize re-renders
          acc.annotations = acc.annotations.concat(value.annotations);
          acc.alertStates = acc.alertStates.concat(value.alertStates);
          return acc;
        })
      )
      .subscribe((result) => {
        this._results.next(result);
      });
  }

  public getAnnotationsStream(): Observable<AnnotationQueryResult> {
    return this._results;
  }
}

export function findFirstDatasource(targets: DataQuery[]): DataSourceRef | undefined {
  return targets.find((t) => t.datasource !== null)?.datasource ?? undefined;
}
