import { SceneObject, SceneUrlSyncOptions } from '../core/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
<<<<<<< HEAD
import { locationService } from '@grafana/runtime';
||||||| d1279ebe
import { getUrlSyncManager } from './UrlSyncManager';
import { locationService } from '@grafana/runtime';
=======
>>>>>>> 55cb8a43baa9158489f5756d1d091c17984cd203
import { writeSceneLog } from '../utils/writeSceneLog';
<<<<<<< HEAD
import { useUrlSyncManager } from './UrlSyncManager';
||||||| d1279ebe
=======
import { useUrlSyncManager } from './UrlSyncManager';
import { useLocationServiceSafe } from '../utils/utils';
>>>>>>> 55cb8a43baa9158489f5756d1d091c17984cd203

export function useUrlSync(sceneRoot: SceneObject, options: SceneUrlSyncOptions = {}): boolean {
  const location = useLocation();
  const locationService = useLocationServiceSafe();
  const [isInitialized, setIsInitialized] = useState(false);
<<<<<<< HEAD
  const urlSyncManager = useUrlSyncManager(options);
||||||| d1279ebe
=======
  const urlSyncManager = useUrlSyncManager(options, locationService);
>>>>>>> 55cb8a43baa9158489f5756d1d091c17984cd203

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
