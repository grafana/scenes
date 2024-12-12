import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { writeSceneLog } from '../utils/writeSceneLog.js';
import { useUrlSyncManager } from './UrlSyncManager.js';
import { useLocationServiceSafe } from '../utils/utils.js';

function useUrlSync(sceneRoot, options = {}) {
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
    const latestLocation = locationService.getLocation();
    const locationToHandle = latestLocation !== location ? latestLocation : location;
    if (latestLocation !== location) {
      writeSceneLog("useUrlSync", "latestLocation different from location");
    }
    urlSyncManager.handleNewLocation(locationToHandle);
  }, [sceneRoot, urlSyncManager, location, locationService]);
  return isInitialized;
}

export { useUrlSync };
//# sourceMappingURL=useUrlSync.js.map
