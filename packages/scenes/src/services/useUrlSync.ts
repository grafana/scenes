import { SceneObject, SceneUrlSyncOptions } from '../core/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { writeSceneLog } from '../utils/writeSceneLog';
import { useUrlSyncManager } from './UrlSyncManager';
import { useLocationServiceSafe } from '../utils/utils';

export function useUrlSync(sceneRoot: SceneObject, options: SceneUrlSyncOptions = {}): boolean {
  const location = useLocation();
  const locationService = useLocationServiceSafe();
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
