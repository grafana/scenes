import React, { useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { NavModelItem, UrlQueryMap } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { SceneComponentProps, SceneObject, SceneObjectStatePlain } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { getLinkUrlWithAppUrlState, useAppQueryParams } from './utils';
import { EmbeddedScene } from '../EmbeddedScene';

const sceneCache = new Map<string, EmbeddedScene>();

export interface SceneAppState extends SceneObjectStatePlain {
  // Array of SceneAppPage objects that are considered app's top level pages
  pages: SceneAppPage[];
}

export interface SceneRouteMatch<Params extends { [K in keyof Params]?: string } = {}> {
  params: Params;
  isExact: boolean;
  path: string;
  url: string;
}

export interface SceneAppRoute {
  path: string;
  page?: SceneAppPage;
  drilldown?: SceneAppDrilldownView;
}

/**
 * Responsible for top level pages routing
 */
export class SceneApp extends SceneObjectBase<SceneAppState> {
  public static Component = ({ model }: SceneComponentProps<SceneApp>) => {
    const { pages } = model.useState();

    return (
      <Switch>
        {pages.map((page) => (
          <Route
            key={page.state.url}
            exact={false}
            path={page.state.url}
            render={() => {
              return page && <page.Component model={page} />;
            }}
          ></Route>
        ))}
      </Switch>
    );
  };
}

export interface SceneAppPageState extends SceneObjectStatePlain {
  title: string;
  subTitle?: string;
  // Use to provide page absolute URL, i.e. /app/overview
  url: string;
  // Use to provide parametrized page URL, i.e. /app/overview/:clusterId
  routePath?: string;
  // Whether or not page should be visible in the breadcrumbs path
  hideFromBreadcrumbs?: boolean;
  // Array of SceneAppPage objects that are used as page tabs displayed on top of the page
  tabs?: SceneAppPage[];
  // Function that returns a scene object for the page
  getScene: (routeMatch: SceneRouteMatch) => EmbeddedScene;
  // Array of scenes used for drilldown views
  drilldowns?: SceneAppDrilldownView[];
  // Function that returns a parent page object, used to create breadcrumbs structure
  getParentPage?: () => SceneAppPage;
  // Array of query params that will be preserved in breadcrumb and page tab links, i.e. ['from', 'to', 'var-datacenter',...]
  preserveUrlKeys?: string[];
}

/**
 * Responsible for page's drilldown & tabs routing
 */
export class SceneAppPage extends SceneObjectBase<SceneAppPageState> {
  public static Component = SceneAppPageRenderer;
}

function SceneAppPageRenderer({ model }: SceneComponentProps<SceneAppPage>) {
  const { tabs, drilldowns, url, routePath } = model.state;
  const routes: React.ReactNode[] = [];

  if (tabs) {
    for (const page of tabs) {
      routes.push(
        <Route
          exact={true}
          key={page.state.url}
          path={page.state.routePath ?? page.state.url}
          render={() => {
            return <page.Component model={page} />;
          }}
        ></Route>
      );

      if (page.state.drilldowns) {
        for (const drilldown of page.state.drilldowns) {
          routes.push(
            <Route
              exact={false}
              key={drilldown.routePath}
              path={drilldown.routePath}
              render={() => {
                return <SceneAppDrilldownViewRender drilldown={drilldown} parent={page} />;
              }}
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
          render={() => {
            return <SceneAppDrilldownViewRender drilldown={drilldown} parent={model} />;
          }}
        ></Route>
      );
    }
  }

  let page = <ScenePageRenderer page={model} />;

  // if parent is a SceneAppPage we are a tab
  if (model.parent instanceof SceneAppPage) {
    page = <ScenePageRenderer page={model.parent} activeTab={model} tabs={model.parent.state.tabs} />;
  }

  return (
    <Switch>
      {/* page route */}
      <Route
        key={url}
        exact={true}
        path={routePath ?? url}
        render={() => {
          return page;
        }}
      ></Route>

      {/* drilldown routes */}
      {routes}
    </Switch>
  );
}

interface ScenePageRenderProps {
  page: SceneAppPage;
  tabs?: SceneAppPage[];
  activeTab?: SceneAppPage;
}

function ScenePageRenderer({ page, tabs, activeTab }: ScenePageRenderProps) {
  /**
   * We use this flag to make sure the URL sync is enabled before the scene is actually rendered.
   */
  const [isInitialized, setIsInitialized] = useState(false);
  const params = useAppQueryParams();
  const routeMatch = useRouteMatch();

  let scene = sceneCache.get(routeMatch!.url);
  if (!scene) {
    // If we are rendering a tab, we need to get the scene f  rom the tab, otherwise, use page's scene
    scene = activeTab ? activeTab.state.getScene(routeMatch) : page.state.getScene(routeMatch);
    sceneCache.set(routeMatch!.url, scene);
  }

  useEffect(() => {
    // Before rendering scene components, we are making sure the URL sync is enabled for.
    if (!isInitialized && scene) {
      scene.initUrlSync();
      setIsInitialized(true);
    }
  }, [isInitialized, scene]);

  if (!isInitialized) {
    return null;
  }

  const pageNav: NavModelItem = {
    text: page.state.title,
    subTitle: page.state.subTitle,
    url: getLinkUrlWithAppUrlState(page.state.url, params, page.state.preserveUrlKeys),
    hideFromBreadcrumbs: page.state.hideFromBreadcrumbs,
    parentItem: getParentBreadcrumbs(page.state.getParentPage ? page.state.getParentPage() : page.parent, params),
  };

  if (tabs) {
    pageNav.children = tabs.map((tab) => {
      return {
        text: tab.state.title,
        active: activeTab === tab,
        url: getLinkUrlWithAppUrlState(tab.state.url, params, tab.state.preserveUrlKeys),
        parentItem: pageNav,
      };
    });
  }

  return (
    <PluginPage pageNav={pageNav} /*hideFooter={true}*/>
      <scene.Component model={scene} />
    </PluginPage>
  );
}

export interface SceneAppDrilldownView {
  // Use to provide parametrized drilldown URL, i.e. /app/clusters/:clusterId
  routePath: string;
  // Function that returns a page object for a given drilldown route match. Use parent to configure drilldown view parent SceneAppPage via getParentPage method.
  getPage: (routeMatch: SceneRouteMatch<any>, parent: SceneAppPage) => SceneAppPage;
}

export function SceneAppDrilldownViewRender(props: { drilldown: SceneAppDrilldownView; parent: SceneAppPage }) {
  const routeMatch = useRouteMatch();
  const scene = props.drilldown.getPage(routeMatch, props.parent);
  return <scene.Component model={scene} />;
}

function getParentBreadcrumbs(parent: SceneObject | undefined, params: UrlQueryMap): NavModelItem | undefined {
  if (parent instanceof SceneAppPage) {
    return {
      text: parent.state.title,
      url: getLinkUrlWithAppUrlState(parent.state.url, params, parent.state.preserveUrlKeys),
      hideFromBreadcrumbs: parent.state.hideFromBreadcrumbs,
      parentItem: getParentBreadcrumbs(
        parent.state.getParentPage ? parent.state.getParentPage() : parent.parent,
        params
      ),
    };
  }

  return undefined;
}
