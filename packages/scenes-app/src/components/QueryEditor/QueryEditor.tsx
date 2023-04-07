import { SceneObjectBase, SceneQueryRunner, SceneDataProvider, SceneObject, SceneObjectState } from '@grafana/scenes';

import { QueryEditorRenderer } from './QueryEditorRenderer';
import { DataQuery, DataSourceRef } from '@grafana/schema';

import { DataSourceApi, ScopedVars } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';

export interface QueryEditorState extends SceneObjectState {
  datasource?: DataSourceApi;
  datasourceLoadErrorMessage?: string;
}

export class QueryEditor extends SceneObjectBase<QueryEditorState> {
  public static Component = QueryEditorRenderer;

  public constructor(state?: Partial<QueryEditorState>) {
    super({ ...state });

    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    const sceneQueryRunner = getSceneQueryRunner(this);

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
/**
 * Will walk up the scene object graph to the closest SceneQueryRunner
 */
export function getSceneQueryRunner(sceneObject: SceneObject): SceneQueryRunner | undefined {
  if (sceneObject.state.$data !== undefined) {
    let curData: SceneDataProvider | undefined = sceneObject.state.$data;
    while (curData !== undefined) {
      if (curData instanceof SceneQueryRunner) {
        return curData;
      }

      curData = curData.state.$data;
    }
  }

  if (sceneObject.parent) {
    return getSceneQueryRunner(sceneObject.parent);
  }

  return undefined;
}

function findFirstDatasource(targets: DataQuery[]) {
  return targets.find((t) => t.datasource !== null)?.datasource ?? undefined;
}

async function getDataSource(datasource: DataSourceRef | undefined, scopedVars: ScopedVars): Promise<DataSourceApi> {
  if (datasource && (datasource as any).query) {
    return datasource as DataSourceApi;
  }
  return await getDataSourceSrv().get(datasource as string, scopedVars);
}
