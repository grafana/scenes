import { locationService, LocationServiceProvider } from '@grafana/runtime';
import React from 'react';
import { Router } from 'react-router-dom';
import { SceneObject, UrlSyncContextProvider } from '../../src';

export function TestContextProvider({ children, scene }: { children: React.ReactNode; scene: SceneObject }) {
  return (
    <LocationServiceProvider service={locationService}>
      <Router history={locationService.getHistory()}>
        <UrlSyncContextProvider scene={scene}>{children}</UrlSyncContextProvider>
      </Router>
    </LocationServiceProvider>
  );
}
