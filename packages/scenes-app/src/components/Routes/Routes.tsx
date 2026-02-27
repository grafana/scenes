import * as React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { DemoListPage } from '../../pages/DemoListPage';
import GrafanaMonitoringApp from '../../monitoring-app/GrafanaMonitoringApp';
import { ReactDemoPage } from '../../react-demo/Home';
import { HomePage } from '../../home-demo/HomeApp';
import { SceneObjectBase } from '@grafana/scenes';

export function AppRoutes() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  if (params.get('renderBeforeActivation') === 'true') {
    SceneObjectBase.RENDER_BEFORE_ACTIVATION_DEFAULT = true;
  }

  return (
    <Routes>
      <Route path={`${ROUTES.Demos}/*`} Component={DemoListPage} />
      <Route path={`${ROUTES.GrafanaMonitoring}/*`} Component={GrafanaMonitoringApp} />
      <Route path={`${ROUTES.ReactDemo}/*`} Component={ReactDemoPage} />
      <Route path="*" Component={HomePage} />
    </Routes>
  );
}
