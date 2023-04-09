import React, { ReactNode } from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneReactObject } from '../SceneReactObject';
import { SceneAppDrilldownViewRender, SceneAppPageView } from './SceneAppPageView';
import { SceneAppPageLike, SceneAppPageState } from './types';
import { renderSceneComponentWithRouteProps } from './utils';

/**
 * Responsible for page's drilldown & tabs routing
 */
export class SceneAppPage extends SceneObjectBase<SceneAppPageState> implements SceneAppPageLike {
  public static Component = SceneAppPageRenderer;

  public initializeScene(scene: EmbeddedScene) {
    scene.initUrlSync();
    this.setState({ initializedScene: scene });
  }
}

export interface SceneAppPageRendererProps extends SceneComponentProps<SceneAppPage> {
  routeProps: RouteComponentProps;
}

function SceneAppPageRenderer({ model, routeProps }: SceneAppPageRendererProps) {
  const { tabs, drilldowns } = model.useState();
  const routes: React.ReactNode[] = [];

  if (tabs) {
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      const tab = tabs[tabIndex];

      // Add first tab as a default route, this makes it possible for the first tab to render with the url of the parent page
      if (tabIndex === 0) {
        routes.push(
          <Route
            exact={true}
            key={model.state.url}
            path={model.state.routePath ?? model.state.url}
            render={(props) => renderSceneComponentWithRouteProps(tab, props)}
          ></Route>
        );
      }

      routes.push(
        <Route
          exact={true}
          key={tab.state.url}
          path={tab.state.routePath ?? tab.state.url}
          render={(props) => renderSceneComponentWithRouteProps(tab, props)}
        ></Route>
      );

      if (tab.state.drilldowns) {
        for (const drilldown of tab.state.drilldowns) {
          routes.push(
            <Route
              exact={false}
              key={drilldown.routePath}
              path={drilldown.routePath}
              render={(props) => <SceneAppDrilldownViewRender drilldown={drilldown} parent={tab} routeProps={props} />}
            ></Route>
          );
        }
      }
    }

    // routes.push(getFallbackRoute(model, routeProps));

    return <Switch>{routes}</Switch>;
  }

  if (drilldowns) {
    for (const drilldown of drilldowns) {
      routes.push(
        <Route
          key={drilldown.routePath}
          exact={false}
          path={drilldown.routePath}
          render={(props) => <SceneAppDrilldownViewRender drilldown={drilldown} parent={model} routeProps={props} />}
        ></Route>
      );
    }
  }

  let page: ReactNode = undefined;
  let isFirstTab = false;
  let parentUrl = '';

  // if parent is a SceneAppPage we are a tab
  if (model.parent instanceof SceneAppPage) {
    page = <SceneAppPageView page={model.parent} activeTab={model} routeProps={routeProps} />;

    // Check if we are the first tab
    if (model.parent.state.tabs) {
      isFirstTab = model.parent.state.tabs[0] === model;
      parentUrl = model.parent.state.url;
    }
  } else {
    page = <SceneAppPageView page={model} routeProps={routeProps} />;
  }

  const { match } = routeProps;
  const currentPageIsRouteMatch =
    match.isExact && (match.url === model.state.url || (isFirstTab && match.url === parentUrl));

  if (currentPageIsRouteMatch) {
    return page;
  }

  routes.push(getFallbackRoute(model, routeProps));

  return <Switch>{routes}</Switch>;
}

function getFallbackRoute(page: SceneAppPage, routeProps: RouteComponentProps) {
  return (
    <Route
      key={'fallback route'}
      render={(props) => {
        const fallbackPage = getDefaultFallbackPage();
        return <SceneAppPageView page={fallbackPage} routeProps={routeProps} />;
      }}
    ></Route>
  );
}

function getDefaultFallbackPage() {
  return new SceneAppPage({
    url: '',
    title: 'Not found',
    subTitle: 'The url did not match any page',
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              flexGrow: 1,
              body: new SceneReactObject({
                component: () => {
                  return (
                    <div>If you found your way here using a link then there might be a bug in this application.</div>
                  );
                },
              }),
            }),
          ],
        }),
      });
    },
  });
}
