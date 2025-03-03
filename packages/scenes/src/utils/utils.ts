import { cloneDeep } from 'lodash';
import { SceneObject, SceneObjectState } from '../core/types';
import { locationService as locationServiceRuntime, useLocationService } from '@grafana/runtime';

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
  return useLocationService ? useLocationService() : locationServiceRuntime;
}

function deepIterateInternal(obj: any, doSomething: (current: any) => any): any {
  if (Array.isArray(obj)) {
    return obj.map((o) => deepIterateInternal(o, doSomething));
  }

  const res = doSomething(obj);
  if (res) {
    return res;
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = deepIterateInternal(obj[key], doSomething);
    }
  }

  return obj;
}

export function deepIterate<T extends object>(obj: Readonly<T>, doSomething: (current: any) => any): T;
// eslint-disable-next-line no-redeclare
export function deepIterate(obj: Readonly<any>, doSomething: (current: any) => any): any {
  const transformedObject = cloneDeep(obj);
  return deepIterateInternal(transformedObject, doSomething);
}
