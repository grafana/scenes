import { SceneObject } from '../core/types';

export interface SceneObjectWithDepth {
  sceneObject: SceneObject;
  depth: number;
}

export class UniqueUrlKeyMapper {
  private index = new Map<string, SceneObject[]>();

  public getUniqueKey(key: string, obj: SceneObject) {
    let objectsWithKey = this.index.get(key);

    if (!objectsWithKey) {
      this.index.set(key, [obj]);
      return key;
    }

    let address = objectsWithKey.findIndex((o) => o === obj);
    if (address === -1) {
      objectsWithKey = filterOutDeadObjects(objectsWithKey);
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

function filterOutDeadObjects(sceneObjects: SceneObject[]) {
  const filtered: SceneObject[] = [];

  for (const obj of sceneObjects) {
    if (obj.parent) {
      obj.parent.forEachChild((child) => {
        if (child === obj) {
          filtered.push(child);
        }
      });
    }
  }

  return filtered;
}
