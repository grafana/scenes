import { css } from '@emotion/css';
import React from 'react';

import { CoreApp, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

import { getSceneQueryRunner, QueryEditor } from './QueryEditor';
import { SceneComponentProps, sceneGraph } from '@grafana/scenes';

export function QueryEditorRenderer({ model }: SceneComponentProps<QueryEditor>) {
  const { datasource, datasourceLoadErrorMessage } = model.useState();

  const { data } = sceneGraph.getData(model).useState();
  const sceneQueryRunner = getSceneQueryRunner(model);
  const queries = sceneQueryRunner?.state.queries;

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

  if (!queries || queries.length === 0) {
    return <div>No queries found.</div>;
  }

  const QueryEditor = datasource.components.QueryEditor;

  return (
    <ul className={styles.editorList}>
      {queries.map((query) => (
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
            queries={queries}
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
