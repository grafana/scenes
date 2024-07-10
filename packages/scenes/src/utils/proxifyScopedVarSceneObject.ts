import { SceneObject } from '../core/types';

interface ScopedVarSceneObjectProxyHandler {
  get(target: any, prop: PropertyKey, receiver: any): any;
}

const handler: ScopedVarSceneObjectProxyHandler = {
  get(target, prop) {
    if (prop === '__proxiedObject') {
      return target;
    }

    return '_r';
  },
};

export function proxifyScopedVarSceneObject(target: SceneObject): ProxiedSceneObject {
  return new Proxy(target, handler);
}

export type ProxiedSceneObject = Record<PropertyKey, '_r'> & {
  __proxiedObject: SceneObject;
};
