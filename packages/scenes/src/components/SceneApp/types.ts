import { ComponentType } from 'react';
import { DataRequestEnricher, SceneObject, SceneObjectState, SceneUrlSyncOptions } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { IconName, PageLayoutType } from '@grafana/data';

export interface SceneRouteMatch<Params extends { [K in keyof Params]?: string } = {}> {
  params: Params;
  isExact: boolean;
  path: string;
  url: string;
}

export interface SceneAppState extends SceneObjectState {
  // Array of SceneAppPage objects that are considered app's top level pages
  pages: SceneAppPageLike[];
  name?: string;
  urlSyncOptions?: SceneUrlSyncOptions;
  defaultPageBackground?: 'primary' | 'canvas';
}

export interface SceneAppRoute {
  path: string;
  page?: SceneAppPageLike;
  drilldown?: SceneAppDrilldownView;
}

export interface SceneAppPageState extends SceneObjectState {
  /** Page title or tab label */
  title: string;
  /** Page subTitle */
  subTitle?: string | React.ReactNode;
  /**
   * Customize title rendering.
   * Please return an unstyled h1 tag here + any additional elements you need.
   **/
  renderTitle?: (title: string) => React.ReactNode;
  /** For an image before title */
  titleImg?: string;
  /** For an icon before title or tab label */
  titleIcon?: IconName;
  /** For a tab label suffix */
  tabSuffix?: ComponentType<{ className?: string }>;
  // Use to provide page absolute URL, i.e. /app/overview
  url: string;
  // Use to provide parametrized page URL, i.e. /app/overview/:clusterId
  // Needs to be a wildcard route if the page has tabs or drilldowns (e.g. /app/overview/*)
  // Needs to be relative to the parent if the page is a tab or drilldown
  routePath: string;
  /** Array of scene object to be rendered at the top right of the page, inline with the page title */
  controls?: SceneObject[];
  // Whether or not page should be visible in the breadcrumbs path
  hideFromBreadcrumbs?: boolean;
  // Array of SceneAppPage objects that are used as page tabs displayed on top of the page
  tabs?: SceneAppPageLike[];
  // Function that returns a scene object for the page
  getScene?: (routeMatch: SceneRouteMatch) => EmbeddedScene;
  // Array of scenes used for drilldown views
  drilldowns?: SceneAppDrilldownView[];
  // Function that returns a parent page object, used to create breadcrumbs structure
  getParentPage?: () => SceneAppPageLike;
  // Array of query params that will be preserved in breadcrumb and page tab links, i.e. ['from', 'to', 'var-datacenter',...]
  preserveUrlKeys?: string[];
  /**
   * The current initialized scene, this is set by the framework after scene url initialization
   **/
  initializedScene?: SceneObject;

  /**
   * Function that returns a fallback scene app page,
   * to be rendered when url does not match current page exactly or any of tabs or drilldowns.
   */
  getFallbackPage?: () => SceneAppPageLike;

  layout?: PageLayoutType;
  background?: 'primary' | 'canvas';
}

export interface SceneAppPageLike extends SceneObject<SceneAppPageState>, DataRequestEnricher {
  initializeScene(scene: SceneObject): void;
  /**
   * @internal. Please don't call this from plugin code.
   * Will call the state.getScene function with the current routeMatch and will cache the resulting Scene using the routeMatch.url as key.
   */
  getScene(routeMatch: SceneRouteMatch): EmbeddedScene;
  /**
   * @internal. Please don't call this from plugin code.
   * Get drilldown scene. Will call the drilldown.getPage function with the current routeMatch and will cache the resulting page using the routeMatch.url as key.
   */
  getDrilldownPage(drilldown: SceneAppDrilldownView, routeMatch: SceneRouteMatch): SceneAppPageLike;
}

export interface SceneAppDrilldownView {
  // Use to provide parametrized drilldown URL, i.e. /app/clusters/:clusterId
  routePath: string;
  defaultRoute?: boolean;
  // Function that returns a page object for a given drilldown route match. Use parent to configure drilldown view parent SceneAppPage via getParentPage method.
  getPage: (routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) => SceneAppPageLike;
}
