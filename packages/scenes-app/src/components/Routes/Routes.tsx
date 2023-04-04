import * as React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { DemoListPage } from '../../pages/DemoListPage';

export const Routes = () => {
  return (
    <Switch>
      {/* <Route path={prefixRoute(`${ROUTES.WithTabs}`)} component={PageWithTabs} />
      <Route path={prefixRoute(`${ROUTES.WithDrilldown}`)} component={WithDrilldown} />
      <Route path={prefixRoute(`${ROUTES.Demos}`)} component={DemoPage} /> */}

      {/* Full-width page (this page will have no navigation bar) */}

      {/* Default page */}
      <Route path={prefixRoute(`${ROUTES.Demos}`)} component={DemoListPage} />
      <Redirect to={prefixRoute(ROUTES.Demos)} />
    </Switch>
  );
};
