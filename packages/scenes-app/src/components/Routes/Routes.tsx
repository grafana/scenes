import * as React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { DemoListPage } from '../../pages/DemoListPage';
import GrafanaMonitoringApp from '../../monitoring-app/GrafanaMonitoringApp';
import { ReactDemoPage } from '../../react-demo/Home';

export const Routes = () => {
  return (
    <Switch>
      {/* Default page */}
      <Route path={prefixRoute(`${ROUTES.Demos}`)} component={DemoListPage} />
      <Route path={prefixRoute(`${ROUTES.GrafanaMonitoring}`)} component={GrafanaMonitoringApp} />
      <Route path={prefixRoute(`${ROUTES.ReactDemo}`)} component={ReactDemoPage} />
      <Redirect to={prefixRoute(ROUTES.Demos)} />
    </Switch>
  );
};
