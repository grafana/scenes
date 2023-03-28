import { DataSourceApi } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneLayoutChildState } from '../../core/types';

import { QueryEditorRenderer } from './QueryEditorRenderer';
import { DataQuery, DataSourceRef } from '@grafana/schema';

import { SceneQueryRunner } from '../../querying/SceneQueryRunner';

export interface QueryEditorState extends SceneLayoutChildState {
  datasource: string | DataSourceRef;
  datasourceLoadErrorMessage?: string;
  loadedDatasource?: DataSourceApi;
}

export class QueryEditor extends SceneObjectBase<QueryEditorState> {
  public static Component = QueryEditorRenderer;

  public constructor(state: Partial<QueryEditorState>) {
    super({ datasource: 'gdev-testdata', ...state });
  }

  public activate() {
    super.activate();

    getDataSourceSrv()
      .get(this.state.datasource)
      .then((datasource) => {
        this.setState({ loadedDatasource: datasource });
      })
      .catch((err: Error) => {
        this.setState({ datasourceLoadErrorMessage: err.message });
      });
  }

  public onChange = (sceneQueryRunner: SceneQueryRunner, query: DataQuery) => {
    const { loadedDatasource } = this.state;
    
    if (sceneQueryRunner && loadedDatasource) {
      sceneQueryRunner.setState({
        queries: [
          {
            datasource: loadedDatasource.getRef(),
            ...query,
          },
        ],
      });

      sceneQueryRunner.runQueries();
    }
  };
}
