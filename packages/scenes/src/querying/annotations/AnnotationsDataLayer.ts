import { AnnotationEvent, arrayToDataFrame, DataSourceApi, DataTopic, PanelData, TimeRange } from '@grafana/data';
import { AnnotationQuery } from '@grafana/schema';
import { from, map, merge, mergeAll, mergeMap, reduce, ReplaySubject, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../core/SceneDataNode';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObjectState, SceneDataProvider, SceneDataProviderResult } from '../../core/types';
import { getDataSource } from '../../utils/getDataSource';
import { executeAnnotationQuery } from './standardAnnotationQuery';

interface AnnotationsDataLayerState extends SceneObjectState {
  data?: PanelData;
  queries: AnnotationQuery[];
}

export class AnnotationsDataLayer extends SceneObjectBase<AnnotationsDataLayerState> implements SceneDataProvider {
  private _querySub?: Unsubscribable;
  private _results = new ReplaySubject<SceneDataProviderResult>();

  public constructor(initialState: AnnotationsDataLayerState) {
    super(initialState);

    this.addActivationHandler(() => this._onActivate());
  }

  public getDataTopic(): DataTopic {
    return DataTopic.Annotations;
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
      return from(getDataSource(query.datasource || undefined, {})).pipe(
        mergeMap((ds) => {
          return executeAnnotationQuery(ds, timeRange, query);
        }),
        map((events) => {
          return events ?? [];
        })
      );
    });

    this._querySub = merge(observables)
      .pipe(
        mergeAll(),
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
    emptyPanelData.annotations = [df];

    this._results.next({ origin: this, data: [df] });

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

/**
 * Use legacy runner. Used only as an escape hatch for easier transition to React based annotation editor.
 */
export function shouldUseLegacyRunner(datasource: DataSourceApi): boolean {
  const { type } = datasource;
  return !datasource.annotations || legacyRunner.includes(type);
}

// These opt outs are here only for quicker and easier migration to react based annotations editors and because
// annotation support API needs some work to support less "standard" editors like prometheus and here it is not
// polluting public API.

const legacyRunner = [
  'prometheus',
  'loki',
  'elasticsearch',
  'grafana-opensearch-datasource', // external
];

/**
 * Opt out of using the default mapping functionality on frontend.
 */
export function shouldUseMappingUI(datasource: DataSourceApi): boolean {
  const { type } = datasource;
  return !(
    type === 'datasource' || //  ODD behavior for "-- Grafana --" datasource
    legacyRunner.includes(type)
  );
}
