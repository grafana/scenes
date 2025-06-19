import { isEqual } from 'lodash';

import { SceneObject, SceneObjectUrlValue, SceneObjectUrlValues } from '../core/types';
import { UniqueUrlKeyMapper, UniqueUrlKeyMapperOptions } from './UniqueUrlKeyMapper';

/**
 * @param root
 * @returns the full scene url state as a object with keys and values
 */
export function getUrlState(
  root: SceneObject,
  uniqueUrlKeyMapperOptions?: UniqueUrlKeyMapperOptions
): SceneObjectUrlValues {
  const urlKeyMapper = new UniqueUrlKeyMapper(uniqueUrlKeyMapperOptions);
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
export function syncStateFromSearchParams(
  root: SceneObject,
  urlParams: URLSearchParams,
  uniqueUrlKeyMapperOptions?: UniqueUrlKeyMapperOptions
) {
  const urlKeyMapper = new UniqueUrlKeyMapper(uniqueUrlKeyMapperOptions);
  syncStateFromUrl(root, urlParams, urlKeyMapper);
}

export function syncStateFromUrl(
  root: SceneObject,
  urlParams: URLSearchParams,
  urlKeyMapper: UniqueUrlKeyMapper,
  onlyChildren?: boolean
) {
  if (!onlyChildren) {
    syncUrlStateToObject(root, urlParams, urlKeyMapper);
  }

  // These two forEachChild loops might look strange but it's to make sure we walk through the scene graph one level at a time as url key conflicts depend depth in the scene tree
  root.forEachChild((child) => {
    syncUrlStateToObject(child, urlParams, urlKeyMapper);
  });

  root.forEachChild((child) => syncStateFromUrl(child, urlParams, urlKeyMapper, true));
}

function syncUrlStateToObject(sceneObject: SceneObject, urlParams: URLSearchParams, urlKeyMapper: UniqueUrlKeyMapper) {
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
