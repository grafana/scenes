import * as React from 'react';
import { Route, Switch } from 'react-router-dom';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { DemoListPage } from '../../pages/DemoListPage';
import GrafanaMonitoringApp from '../../monitoring-app/GrafanaMonitoringApp';
import { ReactDemoPage } from '../../react-demo/Home';
import { HomePage } from '../../home-demo/HomeApp';

export const Routes = () => {
  return (
    <Switch>
      {/* Default page */}
      <Route path={prefixRoute(`${ROUTES.Demos}`)} component={DemoListPage} />
      <Route path={prefixRoute(`${ROUTES.GrafanaMonitoring}`)} component={GrafanaMonitoringApp} />
      <Route path={prefixRoute(`${ROUTES.ReactDemo}`)} component={ReactDemoPage} />
      <Route path={prefixRoute(`${ROUTES.Home}`)} component={HomePage} />
    </Switch>
  );
};
