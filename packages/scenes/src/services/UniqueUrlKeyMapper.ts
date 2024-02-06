import { SceneObject } from '../core/types';

export interface SceneObjectWithDepth {
  sceneObject: SceneObject;
  depth: number;
}

export class UniqueUrlKeyMapper {
  private index = new Map<string, SceneObjectWithDepth[]>();

  public getUniqueKey(key: string, obj: SceneObject) {
    const objectsWithKey = this.index.get(key);
    if (!objectsWithKey) {
      throw new Error("Cannot find any scene object that uses the key '" + key + "'");
    }

    const address = objectsWithKey.findIndex((o) => o.sceneObject === obj);
    if (address > 0) {
      return `${key}-${address + 1}`;
    }

    return key;
  }

  public rebuildIndex(root: SceneObject) {
    this.index.clear();
    this.buildIndex(root, 0);
  }

  private buildIndex(sceneObject: SceneObject, depth: number) {
    if (sceneObject.urlSync) {
      for (const key of sceneObject.urlSync.getKeys()) {
        const hit = this.index.get(key);
        if (hit) {
          hit.push({ sceneObject, depth });
          hit.sort((a, b) => a.depth - b.depth);
        } else {
          this.index.set(key, [{ sceneObject, depth }]);
        }
      }
    }

    sceneObject.forEachChild((child) => this.buildIndex(child, depth + 1));
  }
}
