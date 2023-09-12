import { AnnotationEvent, arrayToDataFrame, DataTopic, PanelData, AnnotationQuery } from '@grafana/data';
import { from, map, merge, mergeAll, mergeMap, reduce, ReplaySubject, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../../core/SceneDataNode';
import { sceneGraph } from '../../../core/sceneGraph';
import { SceneObjectBase } from '../../../core/SceneObjectBase';
import {
  SceneObjectState,
  SceneDataLayerProvider,
  SceneDataLayerProviderResult,
  SceneTimeRangeLike,
} from '../../../core/types';
import { getDataSource } from '../../../utils/getDataSource';
import { executeAnnotationQuery } from './standardAnnotationQuery';
import { postProcessQueryResult } from './utils';

interface AnnotationsDataLayerState extends SceneObjectState {
  data?: PanelData;
  queries: AnnotationQuery[];
}

export class AnnotationsDataLayer extends SceneObjectBase<AnnotationsDataLayerState> implements SceneDataLayerProvider {
  private _querySub?: Unsubscribable;
  private _results = new ReplaySubject<SceneDataLayerProviderResult>();

  public constructor(initialState: AnnotationsDataLayerState) {
    super(initialState);

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    const timeRange = sceneGraph.getTimeRange(this);

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
    this.runWithTimeRange(timeRange);
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
    const { queries } = this.state;

    if (this._querySub) {
      this._querySub.unsubscribe();
    }

    // Simple path when no queries exist
    if (!queries?.length) {
      this.onDataReceived([]);
    }

    const observables = queries
      // get enabled queries
      .filter((q) => q.enable)
      // execute queries & collect results
      .map((query) => {
        // TODO pass scopedVars
        return from(getDataSource(query.datasource || undefined, {})).pipe(
          mergeMap((ds) => {
            // TODO: There is a lot of AnnotationEvents[] -> DataFrame -> AnnotationEvents[] conversion going on here
            // This needs to be refactored an possibly optimized to use DataFrame only.
            // Seems like this is done to allow mappings to be applied by the data source using processEvents method.
            return executeAnnotationQuery(ds, timeRange, query);
          }),

          map((events) => {
            // Feels like this should be done in annotation processing, not as a separate step.
            return postProcessQueryResult(query, events || []);
          })
        );
      });

    this._querySub = merge(observables)
      .pipe(
        mergeAll(),
        // Combine all annotation results into a single array
        reduce((acc: AnnotationEvent[], value: AnnotationEvent[]) => {
          acc = acc.concat(value);
          return acc;
        })
      )
      .subscribe((result) => {
        this.onDataReceived(result);
      });
  }

  public onDataReceived(result: AnnotationEvent[]) {
    // This is only faking panel data
    const stateUpdate = { ...emptyPanelData };
    const df = arrayToDataFrame(result);
    df.meta = {
      ...df.meta,
      dataTopic: DataTopic.Annotations,
    };

    emptyPanelData.annotations = [df];

    this._results.next({ origin: this, data: [df], topic: DataTopic.Annotations });

    this.setState({
      data: stateUpdate,
    });
  }

  public getResultsStream() {
    return this._results;
  }

  public cancelQuery() {
    if (this._querySub) {
      this._querySub.unsubscribe();
      this._querySub = undefined;
    }
  }
}
