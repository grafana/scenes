import { ScopedVars } from '@grafana/data';
import { DefaultTimeRange, EmptyDataNode, EmptyVariableSet } from '../variables/interpolation/defaults';

import { sceneInterpolator } from '../variables/interpolation/sceneInterpolator';
import { VariableCustomFormatterFn, SceneVariables } from '../variables/types';

import { SceneDataProvider, SceneDataState, SceneLayout, SceneObject, SceneTimeRangeLike } from './types';
import { lookupVariable } from '../variables/lookupVariable';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';

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
  const parent = getClosest(scene, (s) => isSceneLayout(s) ? s : undefined);
  if (parent) {
    return parent;
  }

  throw new Error('No layout found in scene tree');
}

/**
 * Will walk up the scene object graph to the closest SceneQueryRunner
 */
export function getSceneQueryRunner(sceneObject: SceneObject): SceneQueryRunner | undefined {
  if (sceneObject.state.$data !== undefined) {
    let curData: SceneDataProvider | undefined = sceneObject.state.$data;
    while (curData !== undefined) {
      if (curData instanceof SceneQueryRunner) {
        return curData;
      }

      curData = curData.state.$data;
    }
  }
  
  if (sceneObject.parent) {
    return getSceneQueryRunner(sceneObject.parent);
  }

  return undefined;
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

export const sceneGraph = {
  getVariables,
  getData,
  getTimeRange,
  getLayout,
  getSceneQueryRunner,
  interpolate,
  lookupVariable,
  hasVariableDependencyInLoadingState,
};
