import { isArray, isEqual } from 'lodash';

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
    let changeDetected = false;

    for (const key of sceneObject.urlSync.getKeys()) {
      const uniqueKey = urlKeyMapper.getUniqueKey(key, sceneObject);
      const currentValue = currentState[key];
      const values: string[] = urlParams.getAll(uniqueKey);
      let newValue: string | string[] | undefined;

      if (values.length > 0) {
        if (!Array.isArray(currentValue)) {
          newValue = values[0];
        }
      } else {
        // mark this key as having no url state
        newValue = undefined;
      }

      urlState[key] = newValue;

      //      console.log('new value', uniqueKey, newValue, currentValue);
      if (!changeDetected && !isUrlValueEqual(currentValue, newValue)) {
        console.log('change detected', uniqueKey, newValue, currentValue);
        changeDetected = true;
      }
    }

    if (changeDetected) {
      sceneObject.urlSync.updateFromUrl(urlState);
    }
  }

  sceneObject.forEachChild((child) => syncStateFromUrl(child, urlParams, urlKeyMapper));
}

export function isUrlValueEqual(a: SceneObjectUrlValue, b: SceneObjectUrlValue): boolean {
  if (a == null && b == null) {
    return true;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }

  // We have two arrays, lets compare them
  return isEqual(a, b);
}
