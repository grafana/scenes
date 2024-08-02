import { useLocationService } from '@grafana/runtime';

import { SceneObject } from '../core/types';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { UrlSyncManager } from './UrlSyncManager';

export function useUrlSync(sceneRoot: SceneObject): boolean {
  const locationService = useLocationService();
  const urlSyncManager = useMemo(() => {
    // TODO: not sure what to do with these typings
    // @ts-ignore
    if (sceneRoot.state.urlSyncManager) {
      // The assumption here is that we need to pass it only in case this get initialized from the
      // UrlSyncContextProvider. In other cases this will create a new syncManager and hopefully that is ok as this
      // should be called once somewhere in the root of the scene.

      // @ts-ignore
      return sceneRoot.state.urlSyncManager;
    }

    return new UrlSyncManager(locationService)
  }, [locationService, sceneRoot]);


  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    urlSyncManager.initSync(sceneRoot);
    setIsInitialized(true);
    return () => urlSyncManager.cleanUp(sceneRoot);
  }, [sceneRoot, urlSyncManager]);

  useEffect(() => {
    // Use latest location, as by the time this effect runs, the location might have changed again
    const latestLocation = locationService.getLocation();
    const locationToHandle = latestLocation !== location ? latestLocation : location;

    if (latestLocation !== location) {
      console.log('latestLocation different from location');
    }

    urlSyncManager.handleNewLocation(locationToHandle);
  }, [sceneRoot, urlSyncManager, location, locationService]);

  return isInitialized;
}

export interface UrlSyncContextProviderProps {
  scene: SceneObject;
  children: React.ReactNode;
}
