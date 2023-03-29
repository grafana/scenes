import { css } from '@emotion/css';
import React, { useEffect } from 'react';

import { CoreApp, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';

import { QueryEditor } from './QueryEditor';
import { getDataSource } from '../../utils/getDataSource';

export function QueryEditorRenderer({ model }: SceneComponentProps<QueryEditor>) {
  const { datasourceLoadErrorMessage, datasource } = model.useState();

  const { data } = sceneGraph.getData(model).useState();
  const sceneQueryRunner = sceneGraph.getSceneQueryRunner(model);

  useEffect(() => {
    const queryRunnerDatasource = sceneQueryRunner?.state.datasource;
    getDataSource(queryRunnerDatasource, {})
      .then((d) => model.setState({ datasource: d }))
      .catch((err) => model.setState({ datasourceLoadErrorMessage: err }));
  }, [sceneQueryRunner?.state.datasource, model]);

  const styles = useStyles2(getStyles);

  if (datasourceLoadErrorMessage) {
    return <div>Failed to load datasource: {datasourceLoadErrorMessage}</div>;
  }

  if (!datasource || !datasource.components) {
    return <div>Loading data source...</div>;
  }

  if (!datasource.components.QueryEditor) {
    return <div>Datasource has no query editor.</div>;
  }

  if (!sceneQueryRunner || sceneQueryRunner.state.queries.length === 0) {
    return <div>No queries found.</div>;
  }

  const QueryEditor = datasource.components.QueryEditor;

  return (
    <ul className={styles.editorList}>
      {sceneQueryRunner.state.queries.map((query) => (
        <li key={query.refId} className={styles.queryEditor}>
          <span className={styles.refIdLabel}>{query.refId}</span>
          <QueryEditor
            key={datasource.name}
            query={query}
            datasource={datasource}
            onChange={(query) => model.onChange(sceneQueryRunner, query)}
            onRunQuery={() => {}}
            onAddQuery={() => {}}
            data={data}
            range={data?.timeRange}
            queries={sceneQueryRunner.state.queries}
            app={CoreApp.PanelEditor}
          />
        </li>
      ))}
    </ul>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    editorList: css({
      overflow: 'auto',
      listStyle: 'none',
      gap: theme.spacing(2),
    }),
    queryEditor: css({
      display: 'flex',
      flexDirection: 'column',
    }),
    refIdLabel: css({
      display: 'flex',
      flexGrow: 1,
      fontSize: theme.typography.h5.fontSize,
    }),
  };
}
