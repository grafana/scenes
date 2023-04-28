import { ScopedVars } from '@grafana/data';
import { DefaultTimeRange, EmptyDataNode, EmptyVariableSet } from '../variables/interpolation/defaults';

import { sceneInterpolator } from '../variables/interpolation/sceneInterpolator';
import { VariableCustomFormatterFn, SceneVariables } from '../variables/types';

import { SceneDataState, SceneLayout, SceneObject, SceneTimeRangeLike } from './types';
import { lookupVariable } from '../variables/lookupVariable';

/** Walks up the scene graph, returning the first non-undefined result of `extract` */
function getClosest<T>(sceneObject: SceneObject, extract: (s: SceneObject) => T | undefined): T | undefined {
  let curSceneObject: SceneObject | undefined = sceneObject;
  let extracted: T | undefined = undefined;

  while (curSceneObject && !extracted) {
    extracted = extract(curSceneObject);
    curSceneObject = curSceneObject.parent;
  }

  return extracted;
}

/**
 * Get the closest node with variables
 */
export function getVariables(sceneObject: SceneObject): SceneVariables {
  return getClosest(sceneObject, (s) => s.state.$variables) ?? EmptyVariableSet;
}

/**
 * Will walk up the scene object graph to the closest $data scene object
 */
export function getData(sceneObject: SceneObject): SceneObject<SceneDataState> {
  return getClosest(sceneObject, (s) => s.state.$data) ?? EmptyDataNode;
}

/**
 * Will walk up the scene object graph to the closest $timeRange scene object
 */
export function getTimeRange(sceneObject: SceneObject): SceneTimeRangeLike {
  return getClosest(sceneObject, (s) => s.state.$timeRange) ?? DefaultTimeRange;
}

function isSceneLayout(s: SceneObject): s is SceneLayout {
  return 'isDraggable' in s;
}

/**
 * Will walk up the scene object graph to the closest $layout scene object
 */
export function getLayout(scene: SceneObject): SceneLayout {
  const parent = getClosest(scene, (s) => (isSceneLayout(s) ? s : undefined));
  if (parent) {
    return parent;
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

export const sceneGraph = {
  getVariables,
  getData,
  getTimeRange,
  getLayout,
  interpolate,
  lookupVariable,
  hasVariableDependencyInLoadingState,
  findObject,
  getClosest,
};
