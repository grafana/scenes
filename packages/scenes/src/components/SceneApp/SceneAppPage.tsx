import React from 'react';
import { Route, Routes, PathRouteProps, useLocation, matchPath } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObject, isDataRequestEnricher } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneReactObject } from '../SceneReactObject';
import { SceneAppDrilldownViewRender, SceneAppPageView } from './SceneAppPageView';
import { SceneAppDrilldownView, SceneAppPageLike, SceneAppPageState, SceneRouteMatch } from './types';
import { renderSceneComponent } from './utils';

/**
 * Responsible for page's drilldown & tabs routing
 */
export class SceneAppPage extends SceneObjectBase<SceneAppPageState> implements SceneAppPageLike {
  public static Component = SceneAppPageRenderer;
  private _sceneCache = new Map<string, EmbeddedScene>();
  private _drilldownCache = new Map<string, SceneAppPageLike>();

  public constructor(state: SceneAppPageState) {
    super(state);
  }

  public initializeScene(scene: EmbeddedScene) {
    this.setState({ initializedScene: scene });
  }

  public getScene(routeMatch: SceneRouteMatch): EmbeddedScene {
    let scene = this._sceneCache.get(routeMatch.url);

    if (scene) {
      return scene;
    }

    if (!this.state.getScene) {
      throw new Error('Missing getScene on SceneAppPage ' + this.state.title);
    }

    scene = this.state.getScene(routeMatch);
    this._sceneCache.set(routeMatch.url, scene);

    return scene;
  }

  public getDrilldownPage(drilldown: SceneAppDrilldownView, routeMatch: SceneRouteMatch<{}>): SceneAppPageLike {
    let page = this._drilldownCache.get(routeMatch!.url);
    if (page) {
      return page;
    }

    page = drilldown.getPage(routeMatch, this);
    this._drilldownCache.set(routeMatch!.url, page);

    return page;
  }

  public enrichDataRequest(source: SceneObject) {
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

export interface SceneAppPageRendererProps extends SceneComponentProps<SceneAppPage> {
  routeProps: PathRouteProps;
}

function SceneAppPageRenderer({ model, routeProps }: SceneAppPageRendererProps) {
  const { tabs, drilldowns } = model.useState();
  const location = useLocation();
  const routes: React.ReactNode[] = [];

  if (tabs && tabs.length > 0) {
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      const tab = tabs[tabIndex];

      // Add first tab as a default route, this makes it possible for the first tab to render with the url of the parent page
      if (tabIndex === 0) {
        routes.push(
          <Route
            key={model.state.url}
            path={model.state.routePath ?? model.state.url}
            Component={() => renderSceneComponent(tab)}
          ></Route>
        );
      }

      routes.push(
        <Route
          key={tab.state.url}
          path={tab.state.routePath ?? tab.state.url}
          Component={() => renderSceneComponent(tab)}
        ></Route>
      );

      if (tab.state.drilldowns) {
        for (const drilldown of tab.state.drilldowns) {
          routes.push(
            <Route
              key={drilldown.routePath}
              path={`${drilldown.routePath}/*`}
              Component={() => <SceneAppDrilldownViewRender drilldown={drilldown} parent={tab} />}
            ></Route>
          );
        }
      }
    }
  }

  if (drilldowns) {
    for (const drilldown of drilldowns) {
      routes.push(
        <Route
          key={drilldown.routePath}
          path={drilldown.routePath}
          Component={() => <SceneAppDrilldownViewRender drilldown={drilldown} parent={model} />}
        ></Route>
      );
    }
  }

  if (!tabs && isCurrentPageRouteMatch(model, location.pathname)) {
    return <SceneAppPageView page={model} />;
  }

  routes.push(getFallbackRoute(model));

  return <Routes>{routes}</Routes>;
}

function getFallbackRoute(page: SceneAppPage) {
  return (
    <Route
      key={'fallback route'}
      Component={() => {
        const fallbackPage = page.state.getFallbackPage?.() ?? getDefaultFallbackPage();
        return <SceneAppPageView page={fallbackPage} />;
      }}
    ></Route>
  );
}

function isCurrentPageRouteMatch(page: SceneAppPage, path: string) {
  const isExactMatch = (url: string) =>
    matchPath(
      {
        path: url,
        caseSensitive: false,
        end: true,
      },
      path
    );

  // Exact match
  if (isExactMatch(page.state.url)) {
    return true;
  }

  // check if we are a tab and the first tab, then we should also render on the parent url
  if (
    page.parent instanceof SceneAppPage &&
    page.parent.state.tabs![0] === page &&
    isExactMatch(page.parent.state.url)
  ) {
    return true;
  }

  return false;
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
              body: new SceneReactObject({
                component: () => {
                  return (
                    <div data-testid="default-fallback-content">
                      If you found your way here using a link then there might be a bug in this application.
                    </div>
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
