import React from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';
import { UrlQueryMap, locationUtil, urlUtil } from '@grafana/data';
import { locationSearchToObject, locationService } from '@grafana/runtime';
import { SceneObject } from '../../core/types';

export function useAppQueryParams(): UrlQueryMap {
  const location = useLocation();
  return locationSearchToObject(location.search || '');
}

/**
 *
 * @param path Url to append query params to
 * @param preserveParams Query params to preserve
 * @returns Url with query params
 */
export function getUrlWithAppState(path: string, preserveParams?: string[]): string {
  // make a copy of params as the renderUrl function mutates the object
  const paramsCopy = { ...locationService.getSearchObject() };

  if (preserveParams) {
    for (const key of Object.keys(paramsCopy)) {
      // if param is not in preserveParams, remove it
      if (!preserveParams.includes(key)) {
        delete paramsCopy[key];
      }
    }
  }

  return urlUtil.renderUrl(locationUtil.assureBaseUrl(path), paramsCopy);
}

export function renderSceneComponentWithRouteProps(sceneObject: SceneObject, routeProps: RouteComponentProps) {
  // @ts-ignore
  return React.createElement(sceneObject.Component, { model: sceneObject, routeProps: routeProps });
}
