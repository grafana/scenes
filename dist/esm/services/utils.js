import { isEqual } from 'lodash';
import { UniqueUrlKeyMapper } from './UniqueUrlKeyMapper.js';

function getUrlState(root) {
  const urlKeyMapper = new UniqueUrlKeyMapper();
  const result = {};
  const visitNode = (obj) => {
    if (obj.urlSync) {
      const newUrlState = obj.urlSync.getUrlState();
      for (const [key, value] of Object.entries(newUrlState)) {
        if (value != null) {
          const uniqueKey = urlKeyMapper.getUniqueKey(key, obj);
          result[uniqueKey] = value;
        }
      }
    }
    obj.forEachChild(visitNode);
  };
  visitNode(root);
  return result;
}
function syncStateFromSearchParams(root, urlParams) {
  const urlKeyMapper = new UniqueUrlKeyMapper();
  syncStateFromUrl(root, urlParams, urlKeyMapper);
}
function syncStateFromUrl(root, urlParams, urlKeyMapper, onlyChildren) {
  if (!onlyChildren) {
    syncUrlStateToObject(root, urlParams, urlKeyMapper);
  }
  root.forEachChild((child) => {
    syncUrlStateToObject(child, urlParams, urlKeyMapper);
  });
  root.forEachChild((child) => syncStateFromUrl(child, urlParams, urlKeyMapper, true));
}
function syncUrlStateToObject(sceneObject, urlParams, urlKeyMapper) {
  if (sceneObject.urlSync) {
    const urlState = {};
    const currentState = sceneObject.urlSync.getUrlState();
    for (const key of sceneObject.urlSync.getKeys()) {
      const uniqueKey = urlKeyMapper.getUniqueKey(key, sceneObject);
      const newValue = urlParams.getAll(uniqueKey);
      const currentValue = currentState[key];
      if (isUrlValueEqual(newValue, currentValue)) {
        continue;
      }
      if (newValue.length > 0) {
        if (Array.isArray(currentValue)) {
          urlState[key] = newValue;
        } else {
          urlState[key] = newValue[0];
        }
      } else {
        urlState[key] = null;
      }
    }
    if (Object.keys(urlState).length > 0) {
      sceneObject.urlSync.updateFromUrl(urlState);
    }
  }
}
function isUrlValueEqual(currentUrlValue, newUrlValue) {
  if (currentUrlValue.length === 0 && newUrlValue == null) {
    return true;
  }
  if (!Array.isArray(newUrlValue) && (currentUrlValue == null ? void 0 : currentUrlValue.length) === 1) {
    return newUrlValue === currentUrlValue[0];
  }
  if ((newUrlValue == null ? void 0 : newUrlValue.length) === 0 && currentUrlValue === null) {
    return true;
  }
  return isEqual(currentUrlValue, newUrlValue);
}

export { getUrlState, isUrlValueEqual, syncStateFromSearchParams, syncStateFromUrl };
//# sourceMappingURL=utils.js.map
