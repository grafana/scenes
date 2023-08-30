import { SceneObject, SceneObjectState } from '../types';

import { SceneObjectBase } from '../SceneObjectBase';
import { SceneObjectRef } from '../SceneObjectRef';

/**
 * Will create new SceneItem with shalled cloned state, but all states items of type SceneObject are deep cloned
 */
export function cloneSceneObject<T extends SceneObjectBase<TState>, TState extends SceneObjectState>(
  sceneObject: SceneObjectBase<TState>,
  withState?: Partial<TState>
): T {
  const clonedState = cloneSceneObjectState(sceneObject.state, withState);
  return new (sceneObject.constructor as any)(clonedState);
}

export function cloneSceneObjectState<TState extends SceneObjectState>(
  sceneState: TState,
  withState?: Partial<TState>
): TState {
  const clonedState = { ...sceneState };

  // Clone any SceneItems in state
  for (const key in clonedState) {
    const propValue = clonedState[key];
    if (propValue instanceof SceneObjectBase) {
      clonedState[key] = propValue.clone();
    }

    if (propValue instanceof SceneObjectRef) {
      throw new Error('Cannot clone a SceneObject with a SceneObjectRef in state');
    }

    // Clone scene objects in arrays
    if (Array.isArray(propValue)) {
      const newArray: any = [];
      for (const child of propValue) {
        if (child instanceof SceneObjectBase) {
          newArray.push(child.clone());
        } else {
          newArray.push(child);
        }
      }
      clonedState[key] = newArray;
    }
  }

  Object.assign(clonedState, withState);

  return clonedState;
}

/** Walks up the scene graph, returning the first non-undefined result of `extract` */
export function getClosest<T>(sceneObject: SceneObject, extract: (s: SceneObject) => T | undefined): T | undefined {
  let curSceneObject: SceneObject | undefined = sceneObject;
  let extracted: T | undefined = undefined;

  while (curSceneObject && !extracted) {
    extracted = extract(curSceneObject);
    curSceneObject = curSceneObject.parent;
  }

  return extracted;
}
