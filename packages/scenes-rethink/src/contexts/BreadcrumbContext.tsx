// import { NavModelItem, UrlQueryMap, urlUtil } from '@grafana/data';
// import { locationSearchToObject, locationService } from '@grafana/runtime';
// import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// import { useLocation } from 'react-router-dom';
// import { useTimeRange, useVariables } from '../hooks/hooks';

// /**
//  * Code and concepts copied from https://github.com/grafana/hackathon-2023-12-grafana-react/blob/main/src/grafana-react
//  *
//  * These contexts & components needs some more thought and naming considerations, just a quick proof of concept for now.
//  */

// type BreadcrumbItem = Pick<NavModelItem, 'text' | 'url'>;

// export interface BreadcrumbContextValue {
//   breadcrumbs: BreadcrumbItem[];
//   addBreadcrumb(breadcrumb: BreadcrumbItem): void;
//   removeBreadcrumb(breadcrumb: BreadcrumbItem): void;
// }

// export const BreadcrumbContext = createContext<BreadcrumbContextValue>({
//   breadcrumbs: [],
//   addBreadcrumb: () => {},
//   removeBreadcrumb: () => {},
// });

// export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
//   const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

//   return (
//     <BreadcrumbContext.Provider
//       value={{
//         breadcrumbs,
//         addBreadcrumb: useCallback((breadcrumb: BreadcrumbItem) => setBreadcrumbs((prev) => [...prev, breadcrumb]), []),
//         removeBreadcrumb: useCallback(
//           (breadcrumb: BreadcrumbItem) => setBreadcrumbs((prev) => prev.filter((b) => b.url !== breadcrumb.url)),
//           []
//         ),
//       }}
//     >
//       {children}
//     </BreadcrumbContext.Provider>
//   );
// }

// export interface BreadcrumbProps {
//   text: string;
//   path: string;
//   extraKeys?: string[];
// }

// export function Breadcrumb({ text, path, extraKeys }: BreadcrumbProps): React.ReactNode {
//   const { addBreadcrumb, removeBreadcrumb } = useContext(BreadcrumbContext);

//   const buildUrl = useUrlBuilder();

//   useEffect(() => {
//     const breadcrumb = {
//       text,
//       url: buildUrl(path, extraKeys),
//     };

//     addBreadcrumb(breadcrumb);

//     return () => {
//       removeBreadcrumb(breadcrumb);
//     };
//   }, [text, path, extraKeys, addBreadcrumb, buildUrl, removeBreadcrumb]);

//   return null;
// }

// function useUrlBuilder() {
//   const queryParams = useQueryParams()[0];
//   const variables = useVariables();
//   const [_, timeRange] = useTimeRange();

//   return useCallback(
//     (urlBase: string, extraKeys: string[] | undefined) => {
//       const params: UrlQueryMap = {};

//       for (const v of variables) {
//         if (v.urlSync && !v.state.skipUrlSync) {
//           const state = v.urlSync.getUrlState();
//           Object.assign(params, state);
//         }
//       }

//       if (timeRange.urlSync) {
//         const state = timeRange.urlSync.getUrlState();
//         Object.assign(params, state);
//       }

//       if (extraKeys) {
//         for (const extra of extraKeys) {
//           if (queryParams[extra]) {
//             params[extra] = queryParams[extra];
//           }
//         }
//       }

//       return urlUtil.renderUrl(urlBase, params);
//     },
//     [variables, queryParams, timeRange]
//   );
// }

// function useQueryParams(): [UrlQueryMap, (values: UrlQueryMap, replace?: boolean) => void] {
//   const { search } = useLocation();
//   const queryParams = useMemo(() => locationSearchToObject(search || ''), [search]);
//   const update = useCallback((values: UrlQueryMap, replace?: boolean) => locationService.partial(values, replace), []);
//   return [queryParams, update];
// }
