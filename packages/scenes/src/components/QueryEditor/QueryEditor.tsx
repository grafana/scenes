import { SceneObjectBase } from '../../core/SceneObjectBase';

import { QueryEditorRenderer } from './QueryEditorRenderer';
import { DataQuery } from '@grafana/schema';

import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneLayoutChildState } from '../../core/types';
import { DataSourceApi } from '@grafana/data';

export interface QueryEditorState extends SceneLayoutChildState {
  datasource?: DataSourceApi;
  datasourceLoadErrorMessage?: string;
}

export class QueryEditor extends SceneObjectBase<QueryEditorState> {
  public static Component = QueryEditorRenderer;

  public constructor(state?: Partial<SceneLayoutChildState>) {
    super({ ...state });
  }

  public activate() {
    super.activate();
  }

  public onChange = (sceneQueryRunner: SceneQueryRunner, query: DataQuery) => {
    if (sceneQueryRunner) {
      const oldQueries = sceneQueryRunner.state.queries;
      sceneQueryRunner.setState({
        queries: oldQueries.map((q) => (q.refId === query.refId ? query : q)),
      });

      sceneQueryRunner.runQueries();
    }
  };
}
