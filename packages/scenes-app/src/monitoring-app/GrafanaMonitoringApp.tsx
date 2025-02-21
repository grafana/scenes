// Libraries
import React, { useMemo } from 'react';

import { SceneApp, SceneAppPage, SceneRouteMatch, SceneAppPageLike } from '@grafana/scenes';

import {
  getOverviewScene,
  getHttpHandlerListScene,
  getOverviewLogsScene,
  getHandlerDetailsScene,
  getHandlerLogsScene,
} from './scenes';
import { getTrafficScene } from './traffic';
import { prefixRoute } from '../utils/utils.routing';

export function GrafanaMonitoringApp() {
  const appScene = useMemo(
    () =>
      new SceneApp({
        pages: [getMainPageScene()],
      }),
    []
  );

  return <appScene.Component model={appScene} />;
}

export function getMainPageScene() {
  return new SceneAppPage({
    title: 'Grafana Monitoring',
    subTitle: 'A custom app with embedded scenes to monitor your Grafana server',
    url: prefixRoute('grafana-monitoring'),
    routePath: 'grafana-monitoring/*',
    hideFromBreadcrumbs: false,
    getScene: getOverviewScene,
    tabs: [
      new SceneAppPage({
        title: 'Overview',
        url: prefixRoute('grafana-monitoring'),
        routePath: '',
        getScene: getOverviewScene,
        preserveUrlKeys: ['from', 'to', 'var-instance'],
      }),
      new SceneAppPage({
        title: 'HTTP handlers',
        url: prefixRoute('grafana-monitoring/handlers'),
        routePath: 'handlers/*',
        getScene: getHttpHandlerListScene,
        preserveUrlKeys: ['from', 'to', 'var-instance'],
        drilldowns: [
          {
            routePath: prefixRoute('grafana-monitoring/handlers/:handler'),
            getPage: getHandlerDrilldownPage,
          },
        ],
      }),
      new SceneAppPage({
        title: 'Traffic',
        url: prefixRoute('grafana-monitoring/traffic'),
        routePath: 'traffic',
        getScene: getTrafficScene,
        preserveUrlKeys: ['from', 'to', 'var-instance'],
      }),
      new SceneAppPage({
        title: 'Logs',
        url: prefixRoute('grafana-monitoring/logs'),
        routePath: 'logs',
        getScene: getOverviewLogsScene,
        preserveUrlKeys: ['from', 'to', 'var-instance'],
      }),
    ],
  });
}

export function getHandlerDrilldownPage(
  match: SceneRouteMatch<{ handler: string; tab?: string }>,
  parent: SceneAppPageLike
) {
  const handler = decodeURIComponent(match.params.handler);
  const baseUrl = prefixRoute(`grafana-monitoring/handlers/${encodeURIComponent(handler)}`);

  return new SceneAppPage({
    title: handler,
    subTitle: 'A grafana http handler is responsible for service a specific API request',
    url: baseUrl,
    routePath: `${encodeURIComponent(handler)}/*`,
    getParentPage: () => parent,
    getScene: () => getHandlerDetailsScene(handler),
    tabs: [
      new SceneAppPage({
        title: 'Metrics',
        url: baseUrl,
        routePath: '',
        getScene: () => getHandlerDetailsScene(handler),
        preserveUrlKeys: ['from', 'to', 'var-instance'],
      }),
      new SceneAppPage({
        title: 'Logs',
        url: baseUrl + '/logs',
        routePath: 'logs',
        getScene: () => getHandlerLogsScene(handler),
        preserveUrlKeys: ['from', 'to', 'var-instance'],
      }),
    ],
  });
}

export default GrafanaMonitoringApp;
