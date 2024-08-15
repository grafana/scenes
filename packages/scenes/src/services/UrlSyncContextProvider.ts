import { SceneObject } from '../core/types';
import { useUrlSync } from './useUrlSync';

export interface UrlSyncContextProviderProps {
  scene: SceneObject;
  children: React.ReactNode;
}

/**
 * Right now this is actually not defining a context, but think it might in the future (with UrlSyncManager as the context value)
 */

export function UrlSyncContextProvider({ children, scene }: UrlSyncContextProviderProps) {
  const isInitialized = useUrlSync(scene);

  if (!isInitialized) {
    return null;
  }

  return children;
}
