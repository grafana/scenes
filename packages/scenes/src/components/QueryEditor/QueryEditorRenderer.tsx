import React from 'react';

import { CoreApp } from '@grafana/data';

import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';

import { QueryEditor } from './QueryEditor';

export function QueryEditorRenderer({ model }: SceneComponentProps<QueryEditor>) {
  const { datasourceLoadErrorMessage, loadedDatasource } = model.useState();

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

  if (!sceneQueryRunner || sceneQueryRunner.state.queries.length === 0) {
    return <div>No queries found.</div>;
  }

  const QueryEditor = loadedDatasource.components.QueryEditor;

  return (
    <QueryEditor
      key={loadedDatasource?.name}
      query={sceneQueryRunner.state.queries[0]}
      datasource={loadedDatasource}
      onChange={(query) => model.onChange(sceneQueryRunner, query)}
      onRunQuery={() => {}}
      onAddQuery={() => {}}
      data={data}
      range={data?.timeRange}
      queries={sceneQueryRunner.state.queries}
      app={CoreApp.PanelEditor}
    />
  );
}
