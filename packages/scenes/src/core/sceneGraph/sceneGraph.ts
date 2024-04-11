import { ScopedVars } from '@grafana/data';
import { EmptyDataNode, EmptyVariableSet } from '../../variables/interpolation/defaults';

import { sceneInterpolator } from '../../variables/interpolation/sceneInterpolator';
import { VariableCustomFormatterFn, SceneVariables } from '../../variables/types';

import { isDataLayer, SceneDataLayerProvider, SceneDataProvider, SceneLayout, SceneObject } from '../types';
import { lookupVariable } from '../../variables/lookupVariable';
import { getClosest } from './utils';
import { SceneQueryControllerLike, isQueryController } from '../../behaviors/SceneQueryController';

/**
 * Get the closest node with variables
 */
export function getVariables(sceneObject: SceneObject): SceneVariables {
  return getClosest(sceneObject, (s) => s.state.$variables) ?? EmptyVariableSet;
}

/**
 * Will walk up the scene object graph to the closest $data scene object
 */
export function getData(sceneObject: SceneObject): SceneDataProvider {
  return getClosest(sceneObject, (s) => s.state.$data) ?? EmptyDataNode;
}

function isSceneLayout(s: SceneObject): s is SceneLayout {
  return 'isDraggable' in s;
}

/**
 * Will walk up the scene object graph to the closest $layout scene object
 */
export function getLayout(scene: SceneObject): SceneLayout | null {
  const parent = getClosest(scene, (s) => (isSceneLayout(s) ? s : undefined));
  if (parent) {
    return parent;
  }

  return null;
}

/**
 * Interpolates the given string using the current scene object as context.   *
 */
export function interpolate(
  sceneObject: SceneObject,
  value: string | undefined | null,
  scopedVars?: ScopedVars,
  format?: string | VariableCustomFormatterFn
): string {
  if (value === '' || value == null) {
    return '';
  }

  return sceneInterpolator(sceneObject, value, scopedVars, format);
}

/**
 * Checks if the variable is currently loading or waiting to update.
 * It also returns true if a dependency of the variable is loading.
 *
 * For example if C depends on variable B which depends on variable A and A is loading this returns true for variable C and B.
 */
export function hasVariableDependencyInLoadingState(sceneObject: SceneObject) {
  if (!sceneObject.variableDependency) {
    return false;
  }

  for (const name of sceneObject.variableDependency.getNames()) {
    const variable = lookupVariable(name, sceneObject);
    if (!variable) {
      continue;
    }

    const set = variable.parent as SceneVariables;
    if (set.isVariableLoadingOrWaitingToUpdate(variable)) {
      return true;
    }
  }

  return false;
}

function findObjectInternal(
  scene: SceneObject,
  check: (obj: SceneObject) => boolean,
  alreadySearchedChild?: SceneObject,
  shouldSearchUp?: boolean
): SceneObject | null {
  if (check(scene)) {
    return scene;
  }

  let found: SceneObject | null = null;

  scene.forEachChild((child) => {
    if (child === alreadySearchedChild) {
      return;
    }

    let maybe = findObjectInternal(child, check);
    if (maybe) {
      found = maybe;
    }
  });

  if (found) {
    return found;
  }

  if (shouldSearchUp && scene.parent) {
    return findObjectInternal(scene.parent, check, scene, true);
  }

  return null;
}

/**
 * This will search the full scene graph, starting with the scene node passed in, then walking up the parent chain. *
 */
export function findObject(scene: SceneObject, check: (obj: SceneObject) => boolean): SceneObject | null {
  return findObjectInternal(scene, check, undefined, true);
}

/**
 * This will search down the full scene graph, looking for objects that match the provided predicate.
 */
export function findAllObjects(scene: SceneObject, check: (obj: SceneObject) => boolean): SceneObject[] {
  const found: SceneObject[] = [];

  scene.forEachChild((child) => {
    if (check(child)) {
      found.push(child);
    }

    found.push(...findAllObjects(child, check));
  });

  return found;
}

/**
 * Will walk up the scene object graph up until the root and collect all SceneDataLayerProvider objects.
 * When localOnly set to true, it will only collect the closest layers.
 */
export function getDataLayers(sceneObject: SceneObject, localOnly = false): SceneDataLayerProvider[] {
  let currentLevel: SceneObject | undefined = sceneObject;
  let collected: SceneDataLayerProvider[] = [];

  while (currentLevel) {
    const dataProvider = currentLevel.state.$data;
    if (!dataProvider) {
      currentLevel = currentLevel.parent;
      continue;
    }

    // Check if data layer exists nested inside another data provider
    if (isDataLayer(dataProvider)) {
      collected = collected.concat(dataProvider);
    } else {
      if (dataProvider.state.$data && isDataLayer(dataProvider.state.$data)) {
        collected = collected.concat(dataProvider.state.$data);
      }
    }

    if (localOnly && collected.length > 0) {
      break;
    }

    currentLevel = currentLevel.parent;
  }

  return collected;
}

/**
 * A utility function to find the closest ancestor of a given type. This function expects
 * to find it and will throw an error if it does not.
 */
export function getAncestor<ParentType>(
  sceneObject: SceneObject,
  ancestorType: { new (...args: never[]): ParentType }
): ParentType {
  let parent: SceneObject | undefined = sceneObject;

  while (parent) {
    if (parent instanceof ancestorType) {
      return parent;
    }
    parent = parent.parent;
  }

  if (!parent) {
    throw new Error('Unable to find parent of type ' + ancestorType.name);
  }

  return parent as ParentType;
}

/**
 * Returns the closest query controller undefined if none found
 */
export function getQueryController(sceneObject: SceneObject): SceneQueryControllerLike | undefined {
  let parent: SceneObject | undefined = sceneObject;

  while (parent) {
    if (parent.state.$behaviors) {
      for (const behavior of parent.state.$behaviors) {
        if (isQueryController(behavior)) {
          return behavior;
        }
      }
    }
    parent = parent.parent;
  }

  return undefined;
}
