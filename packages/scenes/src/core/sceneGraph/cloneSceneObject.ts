import { SceneObjectState } from '../types';
import { SceneObjectBase } from '../SceneObjectBase';
import { SceneObjectRef } from '../SceneObjectRef';
import { cloneDeep } from 'lodash';

/**
 * Will create new SceneItem with shalled cloned state, but all states items of type SceneObject are deep cloned
 */

export function cloneSceneObject<T extends SceneObjectBase<TState>, TState extends SceneObjectState>(
  sceneObject: SceneObjectBase<TState>,
  withState?: Partial<TState>
): T {
  const clonedState = cloneSceneObjectState(sceneObject.state, withState);

  // clean up the cloned key so it's regenerated in the constructor call if no explicit override was provided in withState
  const hasKeyInWithState = withState?.hasOwnProperty('key');
  if (!hasKeyInWithState) {
    clonedState.key = undefined;
  }
  return new (sceneObject.constructor as any)(clonedState);
}

export function cloneSceneObjectState<TState extends SceneObjectState>(
  sceneState: TState,
  withState?: Partial<TState>
): TState {
  const clonedState = { ...sceneState };

  Object.assign(clonedState, withState);

  // Clone any SceneItems in state
  for (const key in clonedState) {
    // Do not clone if was part of withState
    if (withState && withState[key] !== undefined) {
      continue;
    }

    const propValue = clonedState[key];

    if (propValue instanceof SceneObjectRef) {
      console.warn('Cloning object with SceneObjectRef');
      continue;
    }

    if (propValue instanceof SceneObjectBase) {
      clonedState[key] = propValue.clone();
    } else if (Array.isArray(propValue)) {
      const newArray: typeof propValue[0] = [];
      for (const child of propValue) {
        if (child instanceof SceneObjectBase) {
          newArray.push(child.clone());
        } else if (typeof child === 'object') {
          newArray.push(cloneDeep(child));
        } else {
          newArray.push(child);
        }
      }
      clonedState[key] = newArray;
    } else if (typeof propValue === 'object') {
      clonedState[key] = cloneDeep(propValue);
    } else {
      clonedState[key] = propValue;
    }
  }

  return clonedState;
}
