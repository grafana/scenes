import { t, Trans } from '@grafana/i18n';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObject, isDataRequestEnricher } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneReactObject } from '../SceneReactObject';
import { SceneAppDrilldownViewRender, SceneAppPageView } from './SceneAppPageView';
import { SceneAppDrilldownView, SceneAppPageLike, SceneAppPageState, SceneRouteMatch } from './types';

/**
 * Responsible for page's drilldown & tabs routing
 */
export class SceneAppPage extends SceneObjectBase<SceneAppPageState> implements SceneAppPageLike {
  public static Component = SceneAppPageRenderer;
  private _sceneCache = new Map<string, EmbeddedScene>();
  private _drilldownCache = new Map<string, SceneAppPageLike>();

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
function SceneAppPageRenderer({ model }: SceneComponentProps<SceneAppPage>) {
  const { tabs, drilldowns } = model.useState();
  const routes: React.ReactNode[] = [];

  routes.push(getFallbackRoute(model));

  if (tabs && tabs.length > 0) {
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      const tab = tabs[tabIndex];

      // Add first tab as a default route, this makes it possible for the first tab to render with the url of the parent page
      if (tabIndex === 0) {
        routes.push(<Route key={model.state.routePath} path="" element={<tab.Component model={tab} />}></Route>);
      }

      routes.push(
        <Route key={tab.state.url} path={tab.state.routePath} element={<tab.Component model={tab} />}></Route>
      );

      if (tab.state.drilldowns) {
        for (const drilldown of tab.state.drilldowns) {
          routes.push(
            <Route
              key={drilldown.routePath}
              path={drilldown.routePath}
              element={<SceneAppDrilldownViewRender drilldown={drilldown} parent={tab} />}
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

  if (!tabs) {
    routes.push(<Route key="home route" path="/" element={<SceneAppPageView page={model} />}></Route>);
  }

  return <Routes>{routes}</Routes>;
}

function getFallbackRoute(page: SceneAppPage) {
  return (
    <Route
      key={'fallback route'}
      path="*"
      element={<SceneAppPageView page={page.state.getFallbackPage?.() ?? getDefaultFallbackPage()} />}
    ></Route>
  );
}

function getDefaultFallbackPage() {
  return new SceneAppPage({
    url: '',
    title: t('grafana-scenes.components.fallback-page.title', 'Not found'),
    subTitle: t('grafana-scenes.components.fallback-page.subTitle', 'The url did not match any page'),
    routePath: '*',
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
                      <Trans i18nKey="grafana-scenes.components.fallback-page.content">
                        If you found your way here using a link then there might be a bug in this application.
                      </Trans>
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
