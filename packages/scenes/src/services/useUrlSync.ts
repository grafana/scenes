import { SceneObject } from '../core/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getUrlSyncManager } from './UrlSyncManager';

export function useUrlSync(sceneRoot: SceneObject): boolean {
  const urlSyncManager = getUrlSyncManager();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    urlSyncManager.initSync(sceneRoot);
    setIsInitialized(true);
    return () => urlSyncManager.cleanUp(sceneRoot);
  }, [sceneRoot, urlSyncManager]);

  useEffect(() => {
    urlSyncManager.handleNewLocation(location);
  }, [sceneRoot, urlSyncManager, location]);

  return isInitialized;
}

export interface UrlSyncContextProviderProps {
  scene: SceneObject;
  children: React.ReactNode;
}
