import { urlUtil } from '@grafana/data';
import { locationSearchToObject, locationService } from '@grafana/runtime';
import React, { createContext, useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useVariables, useTimeRange } from '../hooks/hooks.js';

const BreadcrumbContext = createContext({
  breadcrumbs: [],
  addBreadcrumb: () => {
  },
  removeBreadcrumb: () => {
  }
});
function BreadcrumbProvider({ children }) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  return /* @__PURE__ */ React.createElement(BreadcrumbContext.Provider, {
    value: {
      breadcrumbs,
      addBreadcrumb: useCallback((breadcrumb) => setBreadcrumbs((prev) => [...prev, breadcrumb]), []),
      removeBreadcrumb: useCallback(
        (breadcrumb) => setBreadcrumbs((prev) => prev.filter((b) => b.url !== breadcrumb.url)),
        []
      )
    }
  }, children);
}
function Breadcrumb({ text, path, extraKeys }) {
  const { addBreadcrumb, removeBreadcrumb } = useContext(BreadcrumbContext);
  const buildUrl = useUrlBuilder();
  useEffect(() => {
    const breadcrumb = {
      text,
      url: buildUrl(path, extraKeys)
    };
    addBreadcrumb(breadcrumb);
    return () => {
      removeBreadcrumb(breadcrumb);
    };
  }, [text, path, extraKeys, addBreadcrumb, buildUrl, removeBreadcrumb]);
  return null;
}
function useUrlBuilder() {
  const queryParams = useQueryParams()[0];
  const variables = useVariables();
  const [_, timeRange] = useTimeRange();
  return useCallback(
    (urlBase, extraKeys) => {
      const params = {};
      for (const v of variables) {
        if (v.urlSync && !v.state.skipUrlSync) {
          const state = v.urlSync.getUrlState();
          Object.assign(params, state);
        }
      }
      if (timeRange.urlSync) {
        const state = timeRange.urlSync.getUrlState();
        Object.assign(params, state);
      }
      if (extraKeys) {
        for (const extra of extraKeys) {
          if (queryParams[extra]) {
            params[extra] = queryParams[extra];
          }
        }
      }
      return urlUtil.renderUrl(urlBase, params);
    },
    [variables, queryParams, timeRange]
  );
}
function useQueryParams() {
  const { search } = useLocation();
  const queryParams = useMemo(() => locationSearchToObject(search || ""), [search]);
  const update = useCallback((values, replace) => locationService.partial(values, replace), []);
  return [queryParams, update];
}

export { Breadcrumb, BreadcrumbContext, BreadcrumbProvider };
//# sourceMappingURL=BreadcrumbContext.js.map
