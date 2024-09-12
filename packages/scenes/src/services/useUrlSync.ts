import { SceneObject, SceneUrlSyncOptions } from '../core/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
// @ts-ignore
import { locationService as locationServiceRuntime, useLocationService } from '@grafana/runtime';
import { writeSceneLog } from '../utils/writeSceneLog';
import { useUrlSyncManager } from './UrlSyncManager';

export function useUrlSync(sceneRoot: SceneObject, options: SceneUrlSyncOptions = {}): boolean {
  const location = useLocation();
  // As we this is basically a version/feature check for grafana/runtime this 'if' should be stable (ie for one instance
  // of grafana this will always be true or false) so it should be safe to ignore the hook rule here
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const locationService = useLocationService ? useLocationService() : locationServiceRuntime;
  const [isInitialized, setIsInitialized] = useState(false);
  const urlSyncManager = useUrlSyncManager(options, locationService);

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
      writeSceneLog('useUrlSync', 'latestLocation different from location');
    }

    urlSyncManager.handleNewLocation(locationToHandle);
  }, [sceneRoot, urlSyncManager, location, locationService]);

  return isInitialized;
}

export interface UrlSyncContextProviderProps {
  scene: SceneObject;
  children: React.ReactNode;
}
