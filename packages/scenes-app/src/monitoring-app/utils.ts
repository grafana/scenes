import { useLocation } from 'react-router-dom';

import { UrlQueryMap, urlUtil } from '@grafana/data';
import { locationSearchToObject } from '@grafana/runtime';
import { QueryVariable, SceneVariableSet } from '@grafana/scenes';

export function useAppQueryParams() {
  const location = useLocation();
  return locationSearchToObject(location.search || '');
}

export function getLinkUrlWithAppUrlState(path: string, params: UrlQueryMap): string {
  return urlUtil.renderUrl(path, params);
}

export function getVariablesDefinitions() {
  return new SceneVariableSet({
    variables: [
      new QueryVariable({
        name: 'instance',
        datasource: { uid: 'gdev-prometheus' },
        query: { query: 'label_values(grafana_http_request_duration_seconds_sum, instance)', refId: 'A' },
      }),
    ],
  });
}
