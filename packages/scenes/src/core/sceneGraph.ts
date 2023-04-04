import { ScopedVars } from '@grafana/data';
import { DefaultTimeRange, EmptyDataNode, EmptyVariableSet } from '../variables/interpolation/defaults';

import { sceneInterpolator } from '../variables/interpolation/sceneInterpolator';
import { VariableCustomFormatterFn, SceneVariables } from '../variables/types';

import { SceneDataState, SceneLayout, SceneObject, SceneTimeRangeLike } from './types';
import { lookupVariable } from '../variables/lookupVariable';

/**
 * Get the closest node with variables
 */
export function getVariables(sceneObject: SceneObject): SceneVariables {
  if (sceneObject.state.$variables) {
    return sceneObject.state.$variables;
  }

  if (sceneObject.parent) {
    return getVariables(sceneObject.parent);
  }

  return EmptyVariableSet;
}

/**
 * Will walk up the scene object graph to the closest $data scene object
 */
export function getData(sceneObject: SceneObject): SceneObject<SceneDataState> {
  const { $data } = sceneObject.state;
  if ($data) {
    return $data;
  }

  if (sceneObject.parent) {
    return getData(sceneObject.parent);
  }

  return EmptyDataNode;
}

/**
 * Will walk up the scene object graph to the closest $timeRange scene object
 */
export function getTimeRange(sceneObject: SceneObject): SceneTimeRangeLike {
  const { $timeRange } = sceneObject.state;
  if ($timeRange) {
    return $timeRange;
  }

  if (sceneObject.parent) {
    return getTimeRange(sceneObject.parent);
  }

  return DefaultTimeRange;
}

/**
 * Will walk up the scene object graph to the closest $layout scene object
 */
export function getLayout(scene: SceneObject): SceneLayout {
  if ('isDraggable' in scene) {
    return scene as SceneLayout;
  }

  if (scene.parent) {
    return getLayout(scene.parent);
  }

  throw new Error('No layout found in scene tree');
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
 * Checks if the variable is currently loading or waiting to update
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
    return set.isVariableLoadingOrWaitingToUpdate(variable);
  }

  return false;
}

function findObjectInternal(
  scene: SceneObject,
  check: (obj: SceneObject) => boolean,
  alreadySearchedChild?: SceneObject
): SceneObject | null {
  if (check(scene)) {
    return scene;
  }

  let found: SceneObject | null = null;

  scene.forEachChild((child) => {
    if (child === alreadySearchedChild) {
      return;
    }

    let maybe = findObject(child, check);
    if (maybe) {
      found = maybe;
      // returning true will "break" the loop
      return true;
    }

    return;
  });

  if (found) {
    return found;
  }

  if (scene.parent) {
    return findObjectInternal(scene.parent, check, scene);
  }

  return null;
}

/**
 * This will search the full scene graph, starting with the scene node passed in, then walking up the parent chain. *
 */
export function findObject(scene: SceneObject, check: (obj: SceneObject) => boolean): SceneObject | null {
  return findObjectInternal(scene, check);
}

export const sceneGraph = {
  getVariables,
  getData,
  getTimeRange,
  getLayout,
  interpolate,
  lookupVariable,
  hasVariableDependencyInLoadingState,
  findObject,
};
