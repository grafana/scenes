import React from 'react';

import { CoreApp } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';

import { QueryEditor } from './QueryEditor';

export function QueryEditorRenderer({ model }: SceneComponentProps<QueryEditor>) {
  const { datasourceLoadErrorMessage, loadedDatasource, query } = model.useState();

  const { data } = sceneGraph.getData(model).useState();
  const sceneQueryRunner = sceneGraph.getSceneQueryRunner(model);

  if (datasourceLoadErrorMessage) {
    return <div>Failed to load datasource: {datasourceLoadErrorMessage}</div>;
  }

  if (!loadedDatasource || !loadedDatasource.components) {
    return <div>Loading data source...</div>;
  }

  if (!loadedDatasource.components.QueryEditor) {
    return <div>Datasource has no query editor.</div>;
  }

  const QueryEditor = loadedDatasource.components.QueryEditor;

  const onChange = (query: DataQuery) => {
    model.setState({ query });

    if (sceneQueryRunner) {
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

  return (
    <QueryEditor
      key={loadedDatasource?.name}
      query={query}
      datasource={loadedDatasource}
      onChange={onChange}
      onRunQuery={() => {}}
      onAddQuery={() => {}}
      data={data}
      range={data?.timeRange}
      queries={[query]}
      app={CoreApp.PanelEditor}
    />
  );
}
