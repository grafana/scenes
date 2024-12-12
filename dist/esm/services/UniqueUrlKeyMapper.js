import { sceneGraph } from '../core/sceneGraph/index.js';

class UniqueUrlKeyMapper {
  constructor() {
    this.index = /* @__PURE__ */ new Map();
  }
  getUniqueKey(key, obj) {
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
  clear() {
    this.index.clear();
  }
}
function filterOutOrphanedObjects(sceneObjects) {
  for (const obj of sceneObjects) {
    if (isOrphanOrInActive(obj)) {
      const index = sceneObjects.indexOf(obj);
      sceneObjects.splice(index, 1);
    }
  }
}
function isOrphanOrInActive(obj) {
  const root = obj.getRoot();
  if (!sceneGraph.findObject(root, (child) => child === obj)) {
    return true;
  }
  return false;
}

export { UniqueUrlKeyMapper };
//# sourceMappingURL=UniqueUrlKeyMapper.js.map
