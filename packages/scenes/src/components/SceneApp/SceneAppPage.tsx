import React, { ReactNode } from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneAppPageView } from './SceneAppPageView';
import { SceneAppDrilldownView, SceneAppPageLike, SceneAppPageState } from './types';
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

  return <Switch>{routes}</Switch>;
}

export interface SceneAppDrilldownViewRenderProps {
  drilldown: SceneAppDrilldownView;
  parent: SceneAppPageLike;
  routeProps: RouteComponentProps;
}

function SceneAppDrilldownViewRender({ drilldown, parent, routeProps }: SceneAppDrilldownViewRenderProps) {
  const scene = drilldown.getPage(routeProps.match, parent);
  return renderSceneComponentWithRouteProps(scene, routeProps);
}
