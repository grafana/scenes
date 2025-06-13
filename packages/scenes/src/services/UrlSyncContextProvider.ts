import { SceneObject, SceneUrlSyncOptions } from '../core/types';
import { useUrlSync } from './useUrlSync';

export interface UrlSyncContextProviderProps extends SceneUrlSyncOptions {
  scene: SceneObject;
  children: React.ReactNode;
  namespace?: string
  excludeParams?: string[]
}

/**
 * Right now this is actually not defining a context, but think it might in the future (with UrlSyncManager as the context value)
 */

export function UrlSyncContextProvider({
  children,
  scene,
  updateUrlOnInit,
  createBrowserHistorySteps,
  namespace,
  excludeParams
}: UrlSyncContextProviderProps) {
  const isInitialized = useUrlSync(scene, { updateUrlOnInit, createBrowserHistorySteps, namespace, excludeParams });

  if (!isInitialized) {
    return null;
  }

  return children;
}
