import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { DemoListPage } from '../../pages/DemoListPage';
import GrafanaMonitoringApp from '../../monitoring-app/GrafanaMonitoringApp';
import { ReactDemoPage } from '../../react-demo/Home';
import { HomePage } from '../../home-demo/HomeApp';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={`${ROUTES.Demos}/*`} Component={DemoListPage} />
      <Route path={`${ROUTES.GrafanaMonitoring}/*`} Component={GrafanaMonitoringApp} />
      <Route path={`${ROUTES.ReactDemo}/*`} Component={ReactDemoPage} />
      <Route path="*" Component={HomePage} />
    </Routes>
  );
}
