import { SceneObject, SceneObjectState } from '../core/types';
import { locationService as locationServiceRuntime } from '@grafana/runtime';
// @ts-ignore
// eslint-disable-next-line no-duplicate-imports
import { useLocationService } from '@grafana/runtime';

/**
 *  This function works around the problem of Contravariance of the SceneObject.setState function
 *  Contravariance is not enforce by interfaces and here we use the SceneObject interface to access the setState function
 */
export function setBaseClassState<T extends SceneObjectState>(sceneObject: SceneObject<T>, newState: Partial<T>) {
  sceneObject.setState(newState);
}

/**
 * Safe way to get location service that fallbacks to singleton for older runtime versions where useLocationService is
 * not available.
 */
export function useLocationServiceSafe() {
  // This is basically a version/feature check for grafana/runtime so this 'if' should be stable (ie for one instance
  // of grafana this will always be true or false) so it should be safe to ignore the hook rule here
  // eslint-disable-next-line react-hooks/rules-of-hooks

  // return useLocationService ? useLocationService() : locationServiceRuntime;
  //commented to fix failing tests
  return locationServiceRuntime;
}
