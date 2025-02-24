import { locationService, LocationServiceProvider } from '@grafana/runtime';
import React, { useEffect, useState } from 'react';
import { Router } from 'react-router-dom';
import { SceneObject } from '../../src/core/types';
import { UrlSyncContextProvider } from '../../src/services/UrlSyncContextProvider';

const history = locationService.getHistory();

export function TestContextProviderBase({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState(history.location);

  useEffect(() => {
    // If we would like to use the same history object in the Router (e.g. what is used in the UrlSyncManager when calling `useLocation()`)
    // and in scenes (when accessed via the `locationService`), then we need to dynamically update the `location={}` prop of the `<Router>`.
    // It is necessary because the underlying `LocationContext` (react-router) is created from the `location` prop.
    // (More info: https://github.com/remix-run/react-router/blob/5d96537148d768b304be3bea7237a12351127807/packages/react-router/lib/components.tsx#L742)
    history.listen(setLocation);
  }, []);

  return (
    <LocationServiceProvider service={locationService}>
      <Router navigator={history} location={location}>
        {children}
      </Router>
    </LocationServiceProvider>
  );
}

export function TestContextProvider({ children, scene }: { children: React.ReactNode; scene: SceneObject }) {
  return (
    <TestContextProviderBase>
      <UrlSyncContextProvider scene={scene}>{children}</UrlSyncContextProvider>
    </TestContextProviderBase>
  );
}
