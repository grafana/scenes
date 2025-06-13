import { sceneGraph } from '../core/sceneGraph';
import { SceneObject, SceneUrlSyncOptions } from '../core/types';
import { locationService as locationServiceRuntime, LocationService } from '@grafana/runtime';
import { getNamespacedKey } from './utils';

export interface SceneObjectWithDepth {
  sceneObject: SceneObject;
  depth: number;
}

export class UniqueUrlKeyMapper {
  private index = new Map<string, SceneObject[]>();
  private _options: SceneUrlSyncOptions;

  public constructor(_options: SceneUrlSyncOptions = {}) {
    this._options = _options;
  }

  public getUniqueKey(rawKey: string, obj: SceneObject) {
    const key = getNamespacedKey(rawKey, this._options.namespace)
    const objectsWithKey = this.index.get(key);

    if (!objectsWithKey) {
      this.index.set(key, [obj]);
      return key;
    }

    let address = objectsWithKey.findIndex((o) => o === obj);
    if (address === -1) {
      filterOutOrphanedObjects(objectsWithKey);
      objectsWithKey.push(obj);

      address = objectsWithKey.length - 1;
    }

    if (address > 0) {
      return `${key}-${address + 1}`;
    }

    return key;
  }

  public clear() {
    this.index.clear();
  }
}

function filterOutOrphanedObjects(sceneObjects: SceneObject[]) {
  for (const obj of sceneObjects) {
    if (isOrphanOrInActive(obj)) {
      const index = sceneObjects.indexOf(obj);
      sceneObjects.splice(index, 1);
    }
  }
}

function isOrphanOrInActive(obj: SceneObject) {
  const root = obj.getRoot();

  // If we cannot find it from the root it's an orphan
  if (!sceneGraph.findObject(root, (child) => child === obj)) {
    return true;
  }

  return false;
}
