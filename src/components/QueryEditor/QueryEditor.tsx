import { DataSourceApi } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { SceneObjectBase } from '../../core/SceneObjectBase';

import { QueryEditorRenderer } from './QueryEditorRenderer';
import { DataQuery, DataSourceRef } from '@grafana/schema';
import { PanelChromeState } from '../PanelChromeRenderer';

export interface QueryEditorState extends PanelChromeState {
  datasource: string | DataSourceRef;
  datasourceLoadErrorMessage?: string;
  loadedDatasource?: DataSourceApi;
  query: DataQuery;
}

export class QueryEditor extends SceneObjectBase<QueryEditorState> {
  public static Component = QueryEditorRenderer;

  public constructor(state: Partial<QueryEditorState>) {
    super({ query: { refId: 'A' }, title: 'Title', datasource: 'gdev-testdata', ...state });
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
}
