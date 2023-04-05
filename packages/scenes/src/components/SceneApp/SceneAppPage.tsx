import React, { useEffect } from 'react';
import { NavModelItem, UrlQueryMap } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneAppDrilldownView, SceneAppPageLike, SceneAppPageState, SceneRouteMatch } from './types';
import { getLinkUrlWithAppUrlState, useAppQueryParams } from './utils';

const sceneCache = new Map<string, EmbeddedScene>();

/**
 * Responsible for page's drilldown & tabs routing
 */
export class SceneAppPage extends SceneObjectBase<SceneAppPageState> {
  public static Component = SceneAppPageRenderer;
}

function SceneAppPageRenderer({ model }: SceneComponentProps<SceneAppPage>) {
  const { tabs, drilldowns, url, routePath } = model.useState();
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

    console.log('routes', routes);
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
    page = <ScenePageRenderer page={model.parent} activeTab={model} />;
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
  page: SceneAppPageLike;
  activeTab?: SceneAppPage;
}

function ScenePageRenderer({ page, activeTab }: ScenePageRenderProps) {
  const pageState = page.useState();
  const params = useAppQueryParams();
  const routeMatch = useRouteMatch();
  const scene = getSceneForPage(routeMatch, page, activeTab);

  const { initializedScene } = pageState;
  const isInitialized = !initializedScene || initializedScene !== scene;

  useEffect(() => {
    // Before rendering scene components, we are making sure the URL sync is enabled for.
    if (!isInitialized && scene) {
      scene.initUrlSync();
      page.setState({ initializedScene: scene });
    }
  }, [isInitialized, scene, page]);

  if (!isInitialized) {
    return null;
  }

  const pageNav: NavModelItem = {
    text: pageState.title,
    subTitle: pageState.subTitle,
    img: pageState.titleImg,
    icon: pageState.titleIcon,
    url: getLinkUrlWithAppUrlState(pageState.url, params, pageState.preserveUrlKeys),
    hideFromBreadcrumbs: pageState.hideFromBreadcrumbs,
    parentItem: getParentBreadcrumbs(pageState.getParentPage ? pageState.getParentPage() : page.parent, params),
  };

  if (pageState.tabs) {
    pageNav.children = pageState.tabs.map((tab) => {
      return {
        text: tab.state.title,
        active: activeTab === tab,
        url: getLinkUrlWithAppUrlState(tab.state.url, params, tab.state.preserveUrlKeys),
        parentItem: pageNav,
      };
    });
  }

  let pageActions: React.ReactNode = undefined;
  if (pageState.controls) {
    pageActions = pageState.controls.map((control) => <control.Component model={control} key={control.state.key} />);
  }

  return (
    <PluginPage pageNav={pageNav} actions={pageActions}>
      <scene.Component model={scene} />
    </PluginPage>
  );
}

function SceneAppDrilldownViewRender(props: { drilldown: SceneAppDrilldownView; parent: SceneAppPageLike }) {
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

function getSceneForPage(
  routeMatch: SceneRouteMatch,
  page: SceneAppPageLike,
  activeTab: SceneAppPageLike | undefined
): EmbeddedScene {
  let scene = sceneCache.get(routeMatch!.url);

  if (scene) {
    return scene;
  }

  let pageToShow = activeTab ?? page;

  if (!pageToShow.state.getScene) {
    throw new Error('Missing getScene on SceneAppPage ' + pageToShow.state.title);
  }

  scene = pageToShow.state.getScene(routeMatch);
  sceneCache.set(routeMatch!.url, scene);

  return scene;
}
