import { sceneGraph } from '../core/sceneGraph';
import { SceneObject } from '../core/types';

export interface SceneObjectWithDepth {
  sceneObject: SceneObject;
  depth: number;
}

export class UniqueUrlKeyMapper {
  private index = new Map<string, SceneObject[]>();

  public getUniqueKey(key: string, obj: SceneObject) {
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
