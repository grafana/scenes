import { SceneObject } from '../core/types';
import { UrlSyncManagerOptions } from './UrlSyncManager';
import { useUrlSync } from './useUrlSync';

export interface UrlSyncContextProviderProps extends UrlSyncManagerOptions {
  scene: SceneObject;
  children: React.ReactNode;
}

/**
 * Right now this is actually not defining a context, but think it might in the future (with UrlSyncManager as the context value)
 */

export function UrlSyncContextProvider({
  children,
  scene,
  updateUrlOnInit,
  createBrowserHistorySteps,
}: UrlSyncContextProviderProps) {
  const isInitialized = useUrlSync(scene, { updateUrlOnInit, createBrowserHistorySteps });

  if (!isInitialized) {
    return null;
  }

  return children;
}
