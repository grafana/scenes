import { NavModelItem, UrlQueryMap } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import React, { useLayoutEffect, useState } from 'react';

import { RouteComponentProps } from 'react-router-dom';
import { SceneObject } from '../../core/types';
import { SceneDebugger } from '../SceneDebugger/SceneDebugger';
import { SceneAppPage } from './SceneAppPage';
import { SceneAppDrilldownView, SceneAppPageLike } from './types';
import { getUrlWithAppState, renderSceneComponentWithRouteProps, useAppQueryParams } from './utils';

export interface Props {
  page: SceneAppPageLike;
  //   activeTab?: SceneAppPageLike;
  routeProps: RouteComponentProps;
}

export function SceneAppPageView({ page, routeProps }: Props) {
  const containerPage = getParentPageIfTab(page);
  const containerState = containerPage.useState();
  const params = useAppQueryParams();
  const scene = page.getScene(routeProps.match);
  const [initialized, setInitialized] = useState(false);

  useLayoutEffect(() => {
    // Before rendering scene components, we are making sure the URL sync is enabled for.
    if (!initialized) {
      containerPage.initializeScene(scene);
      setInitialized(true);
    }
  }, [initialized, scene, containerPage]);

  if (!initialized) {
    return null;
  }

  const pageNav: NavModelItem = {
    text: containerState.title,
    img: containerState.titleImg,
    icon: containerState.titleIcon,
    url: getUrlWithAppState(containerState.url, containerState.preserveUrlKeys),
    hideFromBreadcrumbs: containerState.hideFromBreadcrumbs,
    parentItem: getParentBreadcrumbs(
      containerState.getParentPage ? containerState.getParentPage() : containerPage.parent,
      params
    ),
  };

  if (containerState.tabs) {
    pageNav.children = containerState.tabs.map((tab) => {
      return {
        text: tab.state.title,
        active: page === tab,
        url: getUrlWithAppState(tab.state.url, tab.state.preserveUrlKeys),
        parentItem: pageNav,
      };
    });
  }

  let pageActions: React.ReactNode[] = [];
  if (containerState.controls) {
    pageActions = containerState.controls.map((control) => (
      <control.Component model={control} key={control.state.key} />
    ));
  }

  if (params['scene-debugger']) {
    pageActions.push(<SceneDebugger scene={containerPage} />);
  }

  return (
    <PluginPage
      pageNav={pageNav}
      actions={pageActions}
      renderTitle={containerState.renderTitle}
      subTitle={containerState.subTitle}
    >
      <scene.Component model={scene} />
    </PluginPage>
  );
}

/**
 * For pages that are "tabs" this will return the parent page
 */
function getParentPageIfTab(page: SceneAppPageLike) {
  if (page.parent instanceof SceneAppPage) {
    return page.parent;
  }

  return page;
}

function getParentBreadcrumbs(parent: SceneObject | undefined, params: UrlQueryMap): NavModelItem | undefined {
  if (parent instanceof SceneAppPage) {
    return {
      text: parent.state.title,
      url: getUrlWithAppState(parent.state.url, parent.state.preserveUrlKeys),
      hideFromBreadcrumbs: parent.state.hideFromBreadcrumbs,
      parentItem: getParentBreadcrumbs(
        parent.state.getParentPage ? parent.state.getParentPage() : parent.parent,
        params
      ),
    };
  }

  return undefined;
}

export interface SceneAppDrilldownViewRenderProps {
  drilldown: SceneAppDrilldownView;
  parent: SceneAppPageLike;
  routeProps: RouteComponentProps;
}

export function SceneAppDrilldownViewRender({ drilldown, parent, routeProps }: SceneAppDrilldownViewRenderProps) {
  return renderSceneComponentWithRouteProps(parent.getDrilldownPage(drilldown, routeProps.match), routeProps);
}
