import { NavModelItem, UrlQueryMap } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import React, { useEffect } from 'react';

import { RouteComponentProps } from 'react-router-dom';
import { SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneAppPage } from './SceneAppPage';
import { SceneAppDrilldownView, SceneAppPageLike, SceneRouteMatch } from './types';
import { getLinkUrlWithAppUrlState, renderSceneComponentWithRouteProps, useAppQueryParams } from './utils';

export interface Props {
  page: SceneAppPageLike;
  activeTab?: SceneAppPageLike;
  routeProps: RouteComponentProps;
}

export function SceneAppPageView({ page, activeTab, routeProps }: Props) {
  const pageState = page.useState();
  const params = useAppQueryParams();
  const scene = getEmbeddedSceneCached(routeProps.match, page, activeTab);

  const { initializedScene } = pageState;
  const isInitialized = initializedScene === scene;

  useEffect(() => {
    // Before rendering scene components, we are making sure the URL sync is enabled for.
    if (!isInitialized && scene) {
      page.initializeScene(scene);
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

const sceneCache = new Map<string, EmbeddedScene>();

function getEmbeddedSceneCached(
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

const drilldownCache = new Map<string, SceneAppPageLike>();

function getDrilldownPageCached(
  drilldown: SceneAppDrilldownView,
  parent: SceneAppPageLike,
  routeMatch: SceneRouteMatch
) {
  let page = drilldownCache.get(routeMatch!.url);
  if (page) {
    return page;
  }

  page = drilldown.getPage(routeMatch, parent);
  drilldownCache.set(routeMatch!.url, page);

  return page;
}

export interface SceneAppDrilldownViewRenderProps {
  drilldown: SceneAppDrilldownView;
  parent: SceneAppPageLike;
  routeProps: RouteComponentProps;
}

export function SceneAppDrilldownViewRender({ drilldown, parent, routeProps }: SceneAppDrilldownViewRenderProps) {
  const scene = getDrilldownPageCached(drilldown, parent, routeProps.match);
  return renderSceneComponentWithRouteProps(scene, routeProps);
}
