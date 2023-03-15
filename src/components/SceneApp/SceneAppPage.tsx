import React, { useState, useEffect } from 'react';
import { NavModelItem, UrlQueryMap } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneAppDrilldownView, SceneAppPageLike, SceneAppPageState } from './types';
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

  console.log('SceneAppPageRenderer');

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
  activeTab?: SceneAppPageLike;
}

function ScenePageRenderer({ page, activeTab }: ScenePageRenderProps) {
  /**
   * We use this flag to make sure the URL sync is enabled before the scene is actually rendered.
   */
  const [isInitialized, setIsInitialized] = useState(false);
  const params = useAppQueryParams();
  const routeMatch = useRouteMatch();
  const { tabs, title, subTitle, titleImg, titleIcon, hideFromBreadcrumbs, pageInfo, controls } = page.useState();

  console.log('ScenePageRenderer', page);

  let scene = sceneCache.get(routeMatch!.url);
  if (!scene) {
    // If we are rendering a tab, we need to get the scene f  rom the tab, otherwise, use page's scene
    scene = activeTab ? activeTab.state.getScene(routeMatch) : page.state.getScene(routeMatch);
    sceneCache.set(routeMatch!.url, scene);
  }

  useEffect(() => {
    // Before rendering scene components, we are making sure the URL sync is enabled for.
    if (!isInitialized && scene) {
      // Connect scene with page scene
      page.setState({ currentScene: scene });
      scene.initUrlSync();
      setIsInitialized(true);
    }
  }, [isInitialized, scene, page]);

  if (!isInitialized) {
    return null;
  }

  const pageNav: NavModelItem = {
    text: title,
    subTitle: subTitle,
    img: titleImg,
    icon: titleIcon,
    url: getLinkUrlWithAppUrlState(page.state.url, params, page.state.preserveUrlKeys),
    hideFromBreadcrumbs: hideFromBreadcrumbs,
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

  let pageActions: React.ReactNode = undefined;
  if (controls) {
    pageActions = controls.map((control) => <control.Component model={control} key={control.state.key} />);
  }

  return (
    <PluginPage pageNav={pageNav} info={pageInfo} actions={pageActions}>
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
