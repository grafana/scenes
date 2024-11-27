import { matchPath, useLocation, useParams } from 'react-router-dom';
import { UrlQueryMap, locationUtil, urlUtil } from '@grafana/data';
import { locationSearchToObject } from '@grafana/runtime';
import { SceneRouteMatch } from './types';

export function useAppQueryParams(): UrlQueryMap {
  const location = useLocation();
  return locationSearchToObject(location.search || '');
}

/**
 *
 * @param path Url to append query params to
 * @param searchObject Query params of the URL
 * @param preserveParams Query params to preserve
 * @returns Url with query params
 */
export function getUrlWithAppState(path: string, searchObject: UrlQueryMap, preserveParams?: string[]): string {
  // make a copy of params as the renderUrl function mutates the object
  const paramsCopy = { ...searchObject };

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

export function useSceneRouteMatch(path: string) {
  const params = useParams();
  const location = useLocation();
  const isExact = matchPath(
    {
      path,
      caseSensitive: false,
      end: true,
    },
    location.pathname
  );

  const match: SceneRouteMatch = {
    params,
    isExact: isExact !== null,
    path: location.pathname,
    url: location.pathname,
  };

  return match;
}
