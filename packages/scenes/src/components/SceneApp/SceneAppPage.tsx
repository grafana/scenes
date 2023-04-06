import React, { ReactNode, useEffect } from 'react';
import { NavModelItem, UrlQueryMap } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Route, RouteComponentProps, Switch, useRouteMatch } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneAppDrilldownView, SceneAppPageLike, SceneAppPageState, SceneRouteMatch } from './types';
import { getLinkUrlWithAppUrlState, renderSceneComponentWithRouteProps, useAppQueryParams } from './utils';
import { UrlSyncManager } from '../../services/UrlSyncManager';

const sceneCache = new Map<string, EmbeddedScene>();

/**
 * Responsible for page's drilldown & tabs routing
 */
export class SceneAppPage extends SceneObjectBase<SceneAppPageState> {
  public static Component = SceneAppPageRenderer;
  private urlSyncManager?: UrlSyncManager;

  public constructor(state: SceneAppPageState) {
    super(state);

    this.addActivationHandler(() => {
      console.log('page activated', this.state.title);
      return () => {
        console.log('page deactivated', this.state.title);
      };
    });
  }

  public initializeScene(scene: EmbeddedScene) {
    if (!this.urlSyncManager) {
      this.urlSyncManager = new UrlSyncManager(this);
      this.urlSyncManager.initSync();
    }

    this.urlSyncManager!.syncFrom(scene);
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
    page = <ScenePageRenderer page={model.parent} activeTab={model} />;

    // Check if we are the first tab
    if (model.parent.state.tabs) {
      isFirstTab = model.parent.state.tabs[0] === model;
      parentUrl = model.parent.state.url;
    }
  } else {
    page = <ScenePageRenderer page={model} />;
  }

  const { match } = routeProps;
  const currentPageIsRouteMatch =
    match.isExact && (match.url === model.state.url || (isFirstTab && match.url === parentUrl));

  return (
    <>
      <Switch>{routes}</Switch>
      {currentPageIsRouteMatch && page}
    </>
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
  const isInitialized = initializedScene === scene;

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

export interface SceneAppDrilldownViewRenderProps {
  drilldown: SceneAppDrilldownView;
  parent: SceneAppPageLike;
  routeProps: RouteComponentProps;
}

function SceneAppDrilldownViewRender({ drilldown, parent, routeProps }: SceneAppDrilldownViewRenderProps) {
  const scene = drilldown.getPage(routeProps.match, parent);
  return renderSceneComponentWithRouteProps(scene, routeProps);
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
