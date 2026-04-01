import { SceneObject } from '../core/types';

export interface SceneObjectWithDepth {
  sceneObject: SceneObject;
  depth: number;
}

interface SceneObjectWithPath {
  sceneObject: SceneObject;
  path: number[];
}

export interface UniqueUrlKeyMapperOptions {
  namespace?: string;
  excludeFromNamespace?: string[];
}

const DEFAULT_NAMESPACE = '';
const DEFAULT_EXCLUDE_FROM_NAMESPACE = ['from', 'to', 'timezone'];

export class UniqueUrlKeyMapper {
  private index = new Map<string, SceneObject[]>();
  private options: Required<UniqueUrlKeyMapperOptions>;

  public constructor(options?: UniqueUrlKeyMapperOptions) {
    this.options = {
      namespace: options?.namespace || DEFAULT_NAMESPACE,
      excludeFromNamespace: options?.excludeFromNamespace || DEFAULT_EXCLUDE_FROM_NAMESPACE,
    };
  }

  public getOptions() {
    return this.options;
  }

  private getNamespacedKey(keyWithoutNamespace: string) {
    if (this.options.namespace && !this.options.excludeFromNamespace.includes(keyWithoutNamespace)) {
      return `${this.options.namespace}-${keyWithoutNamespace}`;
    }
    return keyWithoutNamespace;
  }

  public getUniqueKey(keyWithoutNamespace: string, obj: SceneObject) {
    const key = this.getNamespacedKey(keyWithoutNamespace);
    const root = obj.getRoot();
    let objectsWithKey = this.index.get(key);

    if (isVariableKey(keyWithoutNamespace)) {
      // For variable keys, avoid rebuilding deterministic index on every call.
      // Rebuild only when cache is missing or does not include current object.
      if (!objectsWithKey || objectsWithKey.findIndex((o) => o === obj) === -1) {
        objectsWithKey = this.buildDeterministicVariableIndex(keyWithoutNamespace, key, root);
      }
    }

    if (!objectsWithKey) {
      this.index.set(key, [obj]);
      return key;
    }

    let address = objectsWithKey.findIndex((o) => o === obj);
    if (address === -1) {
      filterOutOrphanedObjects(objectsWithKey, root);
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

  private buildDeterministicVariableIndex(
    keyWithoutNamespace: string,
    namespacedKey: string,
    root: SceneObject
  ): SceneObject[] {
    const matchingObjectsWithPath = collectObjectsWithPathForKey(root, keyWithoutNamespace);
    matchingObjectsWithPath.sort(compareByDepthThenPath);
    const matchingObjects = matchingObjectsWithPath.map((obj) => obj.sceneObject);

    this.index.set(namespacedKey, matchingObjects);
    return matchingObjects;
  }
}

function isVariableKey(keyWithoutNamespace: string): boolean {
  return keyWithoutNamespace.startsWith('var-');
}

function compareByDepthThenPath(a: SceneObjectWithPath, b: SceneObjectWithPath): number {
  if (a.path.length !== b.path.length) {
    return a.path.length - b.path.length;
  }

  return comparePathSegments(a.path, b.path);
}

function comparePathSegments(aPath: number[], bPath: number[]): number {
  const minLength = Math.min(aPath.length, bPath.length);
  for (let i = 0; i < minLength; i++) {
    if (aPath[i] !== bPath[i]) {
      return aPath[i] - bPath[i];
    }
  }

  return aPath.length - bPath.length;
}

function collectObjectsWithPathForKey(root: SceneObject, keyWithoutNamespace: string): SceneObjectWithPath[] {
  const result: SceneObjectWithPath[] = [];
  const visit = (obj: SceneObject, path: number[]) => {
    if (obj.urlSync?.getKeys().includes(keyWithoutNamespace)) {
      result.push({ sceneObject: obj, path: [...path] });
    }

    let childIndex = 0;
    obj.forEachChild((child) => {
      visit(child, [...path, childIndex]);
      childIndex++;
    });
  };

  visit(root, []);
  return result;
}

function filterOutOrphanedObjects(sceneObjects: SceneObject[], root: SceneObject) {
  for (let i = 0; i < sceneObjects.length; i++) {
    const obj = sceneObjects[i];
    if (isOrphan(obj, root)) {
      sceneObjects.splice(i, 1);
      i--; // Decrement i to account for the removed element
    }
  }
}

function isOrphan(obj: SceneObject, root: SceneObject) {
  // We don't consider objects without parents to be orphan as they can be top-level scene objects
  if (!obj.parent) {
    return false;
  }

  let found = false;

  obj.parent.forEachChild((child) => {
    if (child === obj) {
      found = true;
      return false; // stop iteration
    }
    return;
  });

  // If we did not find the object among its parent's children it's an orphan
  if (!found) {
    return true;
  }

  return isOrphan(obj.parent, root);
}
