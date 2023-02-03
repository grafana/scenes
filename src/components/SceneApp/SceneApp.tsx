import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { NavModelItem } from '@grafana/data';

import { SceneComponentProps, SceneObject, SceneObjectStatePlain } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { getLinkUrlWithAppUrlState, useAppQueryParams } from './utils';
import { PluginPage } from '@grafana/runtime';
import { EmbeddedScene } from '../EmbeddedScene';

export interface SceneAppState extends SceneObjectStatePlain {
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

export class SceneApp extends SceneObjectBase<SceneAppState> {
  public static Component = ({ model }: SceneComponentProps<SceneApp>) => {
    const { pages } = model.useState();

    return (
      <Switch>
        {pages.map((page) => (
          <Route key={page.state.url} exact={false} path={page.state.url}>
            {page && <page.Component model={page} />}
          </Route>
        ))}
      </Switch>
    );
  };
}

export interface SceneAppPageState extends SceneObjectStatePlain {
  title: string;
  url: string;
  routePath?: string;
  subTitle?: string;
  hideFromBreadcrumbs?: boolean;
  tabs?: SceneAppPage[];
  getScene: (routeMatch: SceneRouteMatch) => EmbeddedScene;
  drilldowns?: SceneAppDrilldownView[];
  getParentPage?: () => SceneAppPage;
  preserveUrlKeys?: string[];
}

const sceneCache = new Map<string, EmbeddedScene>();

export class SceneAppPage extends SceneObjectBase<SceneAppPageState> {
  public static Component = ({ model }: SceneComponentProps<SceneAppPage>) => {
    const { tabs, drilldowns, url, routePath } = model.state;

    const routes: React.ReactNode[] = [];

    if (tabs) {
      for (const page of tabs) {
        routes.push(
          <Route key={page.state.url} exact={true} path={page.state.routePath ?? page.state.url}>
            <page.Component model={page} />
          </Route>
        );

        if (page.state.drilldowns) {
          for (const drilldown of page.state.drilldowns) {
            console.log('registering drilldown route', drilldown.routePath);
            routes.push(
              <Route key={drilldown.routePath} exact={false} path={drilldown.routePath}>
                <SceneAppDrilldownViewRender drilldown={drilldown} parent={page} />
              </Route>
            );
          }
        }
      }

      return <Switch>{routes}</Switch>;
    }

    if (drilldowns) {
      for (const drilldown of drilldowns) {
        console.log('registering non-tab drilldown route', drilldown.routePath);
        routes.push(
          <Route key={drilldown.routePath} exact={false} path={drilldown.routePath}>
            <SceneAppDrilldownViewRender drilldown={drilldown} parent={model} />
          </Route>
        );
      }
    }

    const routeMatch = useRouteMatch();
    console.log('routeMatch path', routeMatch.url);

    let scene = sceneCache.get(routeMatch.url);
    if (!scene) {
      scene = model.state.getScene(routeMatch);
      sceneCache.set(routeMatch.url, scene);
    }

    scene.initUrlSync();

    console.log('rendering page!', model.state.url);

    let page = <PageRenderer page={model} scene={scene} />;
    // if parent is a SceneAppPage we are a tab
    if (model.parent instanceof SceneAppPage) {
      page = <PageRenderer page={model.parent} scene={scene} activeTab={model} tabs={model.parent.state.tabs} />;
    }

    return (
      <Switch>
        {/* page route */}
        <Route key={url} exact={true} path={routePath ?? url}>
          {page}
        </Route>
        {/* drilldown routes */}
        {routes}
      </Switch>
    );

    // return ;
  };
}

interface ScenePageRenderProps {
  page: SceneAppPage;
  tabs?: SceneAppPage[];
  activeTab?: SceneAppPage;
  scene: SceneObject;
}

function PageRenderer({ page, tabs, activeTab, scene }: ScenePageRenderProps) {
  const params = useAppQueryParams();

  const pageNav: NavModelItem = {
    text: page.state.title,
    subTitle: page.state.subTitle,
    url: page.state.url,
    hideFromBreadcrumbs: page.state.hideFromBreadcrumbs,
    parentItem: getParentBreadcrumbs(page.state.getParentPage ? page.state.getParentPage() : page.parent),
  };

  if (tabs) {
    pageNav.children = tabs.map((tab) => ({
      text: tab.state.title,
      active: activeTab === tab,
      url: getLinkUrlWithAppUrlState(tab.state.url, params),
      parentItem: pageNav,
    }));
  }

  return (
    <PluginPage /*navId="grafana-monitoring"*/ pageNav={pageNav} /*hideFooter={true}*/>
      <scene.Component model={scene} />
    </PluginPage>
  );
}

function getParentBreadcrumbs(parent: SceneObject | undefined): NavModelItem | undefined {
  if (parent instanceof SceneAppPage) {
    return {
      text: parent.state.title,
      url: parent.state.url,
      hideFromBreadcrumbs: parent.state.hideFromBreadcrumbs,
      parentItem: getParentBreadcrumbs(parent.state.getParentPage ? parent.state.getParentPage() : parent.parent),
    };
  }

  return undefined;
}

export interface SceneAppDrilldownView {
  routePath: string;
  getPage: (routeMatch: SceneRouteMatch<any>, parent: SceneAppPage) => SceneAppPage;
}

export function SceneAppDrilldownViewRender(props: { drilldown: SceneAppDrilldownView; parent: SceneAppPage }) {
  const routeMatch = useRouteMatch();
  const scene = props.drilldown.getPage(routeMatch, props.parent);
  console.log('drilldown!');
  return <scene.Component model={scene} />;
}
