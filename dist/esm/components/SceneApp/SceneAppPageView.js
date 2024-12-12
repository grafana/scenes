import { PluginPage } from '@grafana/runtime';
import React, { useContext, useLayoutEffect, useEffect } from 'react';
import { SceneDebugger } from '../SceneDebugger/SceneDebugger.js';
import { SceneAppPage } from './SceneAppPage.js';
import { useAppQueryParams, getUrlWithAppState, renderSceneComponentWithRouteProps } from './utils.js';
import { useUrlSync } from '../../services/useUrlSync.js';
import { SceneAppContext } from './SceneApp.js';
import { useLocationServiceSafe } from '../../utils/utils.js';

function SceneAppPageView({ page, routeProps }) {
  const containerPage = getParentPageIfTab(page);
  const containerState = containerPage.useState();
  const params = useAppQueryParams();
  const scene = page.getScene(routeProps.match);
  const appContext = useContext(SceneAppContext);
  const isInitialized = containerState.initializedScene === scene;
  const { layout } = page.state;
  const locationService = useLocationServiceSafe();
  useLayoutEffect(() => {
    if (!isInitialized) {
      containerPage.initializeScene(scene);
    }
  }, [scene, containerPage, isInitialized]);
  useEffect(() => {
    return () => containerPage.setState({ initializedScene: void 0 });
  }, [containerPage]);
  const urlSyncInitialized = useUrlSync(containerPage, appContext == null ? void 0 : appContext.state.urlSyncOptions);
  if (!isInitialized && !urlSyncInitialized) {
    return null;
  }
  const pageNav = {
    text: containerState.title,
    img: containerState.titleImg,
    icon: containerState.titleIcon,
    url: getUrlWithAppState(containerState.url, locationService.getSearchObject(), containerState.preserveUrlKeys),
    hideFromBreadcrumbs: containerState.hideFromBreadcrumbs,
    parentItem: getParentBreadcrumbs(
      containerState.getParentPage ? containerState.getParentPage() : containerPage.parent,
      params,
      locationService.getSearchObject()
    )
  };
  if (containerState.tabs) {
    pageNav.children = containerState.tabs.map((tab) => {
      return {
        text: tab.state.title,
        icon: tab.state.titleIcon,
        tabSuffix: tab.state.tabSuffix,
        active: page === tab,
        url: getUrlWithAppState(tab.state.url, locationService.getSearchObject(), tab.state.preserveUrlKeys),
        parentItem: pageNav
      };
    });
  }
  let pageActions = [];
  if (containerState.controls) {
    pageActions = containerState.controls.map((control) => /* @__PURE__ */ React.createElement(control.Component, {
      model: control,
      key: control.state.key
    }));
  }
  if (params["scene-debugger"]) {
    pageActions.push(/* @__PURE__ */ React.createElement(SceneDebugger, {
      scene: containerPage,
      key: "scene-debugger"
    }));
  }
  return /* @__PURE__ */ React.createElement(PluginPage, {
    layout,
    pageNav,
    actions: pageActions,
    renderTitle: containerState.renderTitle,
    subTitle: containerState.subTitle
  }, /* @__PURE__ */ React.createElement(scene.Component, {
    model: scene
  }));
}
function getParentPageIfTab(page) {
  if (page.parent instanceof SceneAppPage) {
    return page.parent;
  }
  return page;
}
function getParentBreadcrumbs(parent, params, searchObject) {
  if (parent instanceof SceneAppPage) {
    return {
      text: parent.state.title,
      url: getUrlWithAppState(parent.state.url, searchObject, parent.state.preserveUrlKeys),
      hideFromBreadcrumbs: parent.state.hideFromBreadcrumbs,
      parentItem: getParentBreadcrumbs(
        parent.state.getParentPage ? parent.state.getParentPage() : parent.parent,
        params,
        searchObject
      )
    };
  }
  return void 0;
}
function SceneAppDrilldownViewRender({ drilldown, parent, routeProps }) {
  return renderSceneComponentWithRouteProps(parent.getDrilldownPage(drilldown, routeProps.match), routeProps);
}

export { SceneAppDrilldownViewRender, SceneAppPageView };
//# sourceMappingURL=SceneAppPageView.js.map
