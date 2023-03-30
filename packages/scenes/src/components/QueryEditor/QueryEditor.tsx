import { SceneObjectBase } from '../../core/SceneObjectBase';

import { QueryEditorRenderer } from './QueryEditorRenderer';
import { DataQuery } from '@grafana/schema';

import { findFirstDatasource, SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneLayoutChildState } from '../../core/types';
import { DataSourceApi } from '@grafana/data';
import { getDataSource } from '../../utils/getDataSource';
import { sceneGraph } from '../../core/sceneGraph';

export interface QueryEditorState extends SceneLayoutChildState {
  datasource?: DataSourceApi;
  datasourceLoadErrorMessage?: string;
}

export class QueryEditor extends SceneObjectBase<QueryEditorState> {
  public static Component = QueryEditorRenderer;

  public constructor(state?: Partial<SceneLayoutChildState>) {
    super({ ...state });

    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    const sceneQueryRunner = sceneGraph.getSceneQueryRunner(this);

    if (sceneQueryRunner) {
      this._subs.add(
        sceneQueryRunner.subscribeToState((state, prevState) => {
          const datasource = state.datasource ?? findFirstDatasource(state.queries);
          const prevDatasource = prevState.datasource ?? findFirstDatasource(prevState.queries);

          if (datasource?.uid !== prevDatasource?.uid || (datasource && !this.state.datasource)) {
            getDataSource(state.datasource, {})
              .then((d) => this.setState({ datasource: d }))
              .catch((err) => this.setState({ datasourceLoadErrorMessage: err }));
          }
        })
      );
    }
  };

  public onChange = (sceneQueryRunner: SceneQueryRunner, query: DataQuery) => {
    const oldQueries = sceneQueryRunner.state.queries;
    sceneQueryRunner.setState({
      queries: oldQueries.map((q) => (q.refId === query.refId ? query : q)),
    });

    sceneQueryRunner.runQueries();
  };
}
