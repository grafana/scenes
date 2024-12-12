import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { isDataRequestEnricher } from '../../core/types.js';
import { EmbeddedScene } from '../EmbeddedScene.js';
import { SceneFlexLayout, SceneFlexItem } from '../layout/SceneFlexLayout.js';
import { SceneReactObject } from '../SceneReactObject.js';
import { SceneAppDrilldownViewRender, SceneAppPageView } from './SceneAppPageView.js';
import { renderSceneComponentWithRouteProps } from './utils.js';

class SceneAppPage extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._sceneCache = /* @__PURE__ */ new Map();
    this._drilldownCache = /* @__PURE__ */ new Map();
  }
  initializeScene(scene) {
    this.setState({ initializedScene: scene });
  }
  getScene(routeMatch) {
    let scene = this._sceneCache.get(routeMatch.url);
    if (scene) {
      return scene;
    }
    if (!this.state.getScene) {
      throw new Error("Missing getScene on SceneAppPage " + this.state.title);
    }
    scene = this.state.getScene(routeMatch);
    this._sceneCache.set(routeMatch.url, scene);
    return scene;
  }
  getDrilldownPage(drilldown, routeMatch) {
    let page = this._drilldownCache.get(routeMatch.url);
    if (page) {
      return page;
    }
    page = drilldown.getPage(routeMatch, this);
    this._drilldownCache.set(routeMatch.url, page);
    return page;
  }
  enrichDataRequest(source) {
    if (this.state.getParentPage) {
      return this.state.getParentPage().enrichDataRequest(source);
    }
    if (!this.parent) {
      return null;
    }
    const root = this.getRoot();
    if (isDataRequestEnricher(root)) {
      return root.enrichDataRequest(source);
    }
    return null;
  }
}
SceneAppPage.Component = SceneAppPageRenderer;
function SceneAppPageRenderer({ model, routeProps }) {
  var _a, _b;
  const { tabs, drilldowns } = model.useState();
  const routes = [];
  if (tabs && tabs.length > 0) {
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      const tab = tabs[tabIndex];
      if (tabIndex === 0) {
        routes.push(
          /* @__PURE__ */ React.createElement(Route, {
            exact: true,
            key: model.state.url,
            path: (_a = model.state.routePath) != null ? _a : model.state.url,
            render: (props) => renderSceneComponentWithRouteProps(tab, props)
          })
        );
      }
      routes.push(
        /* @__PURE__ */ React.createElement(Route, {
          exact: true,
          key: tab.state.url,
          path: (_b = tab.state.routePath) != null ? _b : tab.state.url,
          render: (props) => renderSceneComponentWithRouteProps(tab, props)
        })
      );
      if (tab.state.drilldowns) {
        for (const drilldown of tab.state.drilldowns) {
          routes.push(
            /* @__PURE__ */ React.createElement(Route, {
              exact: false,
              key: drilldown.routePath,
              path: drilldown.routePath,
              render: (props) => /* @__PURE__ */ React.createElement(SceneAppDrilldownViewRender, {
                drilldown,
                parent: tab,
                routeProps: props
              })
            })
          );
        }
      }
    }
  }
  if (drilldowns) {
    for (const drilldown of drilldowns) {
      routes.push(
        /* @__PURE__ */ React.createElement(Route, {
          key: drilldown.routePath,
          exact: false,
          path: drilldown.routePath,
          render: (props) => /* @__PURE__ */ React.createElement(SceneAppDrilldownViewRender, {
            drilldown,
            parent: model,
            routeProps: props
          })
        })
      );
    }
  }
  if (!tabs && isCurrentPageRouteMatch(model, routeProps.match)) {
    return /* @__PURE__ */ React.createElement(SceneAppPageView, {
      page: model,
      routeProps
    });
  }
  routes.push(getFallbackRoute(model, routeProps));
  return /* @__PURE__ */ React.createElement(Switch, null, routes);
}
function getFallbackRoute(page, routeProps) {
  return /* @__PURE__ */ React.createElement(Route, {
    key: "fallback route",
    render: (props) => {
      var _a, _b, _c;
      const fallbackPage = (_c = (_b = (_a = page.state).getFallbackPage) == null ? void 0 : _b.call(_a)) != null ? _c : getDefaultFallbackPage();
      return /* @__PURE__ */ React.createElement(SceneAppPageView, {
        page: fallbackPage,
        routeProps
      });
    }
  });
}
function isCurrentPageRouteMatch(page, match) {
  if (!match.isExact) {
    return false;
  }
  if (match.url === page.state.url) {
    return true;
  }
  if (page.parent instanceof SceneAppPage && page.parent.state.tabs[0] === page && page.parent.state.url === match.url) {
    return true;
  }
  return false;
}
function getDefaultFallbackPage() {
  return new SceneAppPage({
    url: "",
    title: "Not found",
    subTitle: "The url did not match any page",
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          direction: "column",
          children: [
            new SceneFlexItem({
              body: new SceneReactObject({
                component: () => {
                  return /* @__PURE__ */ React.createElement("div", {
                    "data-testid": "default-fallback-content"
                  }, "If you found your way here using a link then there might be a bug in this application.");
                }
              })
            })
          ]
        })
      });
    }
  });
}

export { SceneAppPage };
//# sourceMappingURL=SceneAppPage.js.map
