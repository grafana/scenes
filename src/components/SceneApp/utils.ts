import { useLocation } from 'react-router-dom';

import { UrlQueryMap, urlUtil } from '@grafana/data';
import { locationSearchToObject } from '@grafana/runtime';

export function useAppQueryParams() {
  const location = useLocation();
  return locationSearchToObject(location.search || '');
}

export function getLinkUrlWithAppUrlState(path: string, params: UrlQueryMap, preserveParams?: string[]): string {
  // make a copy of params as the renderUrl function mutates the object
  const paramsCopy = { ...params };

  if (preserveParams) {
    for (const key of Object.keys(paramsCopy)) {
      // if param is not in preserveParams, remove it
      if (!preserveParams.includes(key)) {
        delete paramsCopy[key];
      }
    }
  }

  return urlUtil.renderUrl(path, paramsCopy);
}
