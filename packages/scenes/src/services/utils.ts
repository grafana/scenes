import { isEqual } from 'lodash';

import { SceneObject, SceneObjectUrlValue, SceneObjectUrlValues } from '../core/types';
import { UniqueUrlKeyMapper } from './UniqueUrlKeyMapper';

/**
 * @param root
 * @returns the full scene url state as a object with keys and values
 */
export function getUrlState(root: SceneObject): SceneObjectUrlValues {
  const urlKeyMapper = new UniqueUrlKeyMapper();
  urlKeyMapper.rebuildIndex(root);

  const result: SceneObjectUrlValues = {};

  const visitNode = (obj: SceneObject) => {
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

/**
 * Exported util function to sync state from an initial url state.
 * Useful for initializing an embedded scenes with a url state string.
 */
export function syncStateFromSearchParams(root: SceneObject, urlParams: URLSearchParams) {
  const urlKeyMapper = new UniqueUrlKeyMapper();
  urlKeyMapper.rebuildIndex(root);
  syncStateFromUrl(root, urlParams, urlKeyMapper);
}

export function syncStateFromUrl(
  sceneObject: SceneObject,
  urlParams: URLSearchParams,
  urlKeyMapper: UniqueUrlKeyMapper
) {
  if (sceneObject.urlSync) {
    const urlState: SceneObjectUrlValues = {};
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
        // mark this key as having no url state
        urlState[key] = null;
      }
    }

    if (Object.keys(urlState).length > 0) {
      sceneObject.urlSync.updateFromUrl(urlState);
    }
  }

  sceneObject.forEachChild((child) => syncStateFromUrl(child, urlParams, urlKeyMapper));
}

export function isUrlValueEqual(currentUrlValue: string[], newUrlValue: SceneObjectUrlValue): boolean {
  if (currentUrlValue.length === 0 && newUrlValue == null) {
    return true;
  }

  if (!Array.isArray(newUrlValue) && currentUrlValue?.length === 1) {
    return newUrlValue === currentUrlValue[0];
  }

  if (newUrlValue?.length === 0 && currentUrlValue === null) {
    return true;
  }

  // We have two arrays, lets compare them
  return isEqual(currentUrlValue, newUrlValue);
}
