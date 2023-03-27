import * as React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { HomePage } from '../../pages/Home';
import { PageWithTabs } from '../../pages/WithTabs';
import { WithDrilldown } from '../../pages/WithDrilldown';
import { DemoPage } from '../../pages/Demos';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';

export const Routes = () => {
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.WithTabs}`)} component={PageWithTabs} />
      <Route path={prefixRoute(`${ROUTES.WithDrilldown}`)} component={WithDrilldown} />
      <Route path={prefixRoute(`${ROUTES.Demos}`)} component={DemoPage} />

      {/* Full-width page (this page will have no navigation bar) */}

      {/* Default page */}
      <Route path={prefixRoute(`${ROUTES.Home}`)} component={HomePage} />

      <Redirect to={prefixRoute(ROUTES.Home)} />
    </Switch>
  );
};
