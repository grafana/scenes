import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = '',
  Demos = 'demos',
  GrafanaMonitoring = 'grafana-monitoring',
  ReactDemo = 'react-only',
  PluginSceneApp1 = 'plugin-scene-app-1',
  PluginSceneApp2 = 'plugin-scene-app-2',
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};
