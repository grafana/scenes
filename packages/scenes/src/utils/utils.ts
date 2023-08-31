import { SceneObject, SceneObjectState } from '../core/types';

/**
 *  This function works around the problem of Contravariance of the SceneObject.setState function
 *  Contravariance is not enforce by interfaces and here we use the SceneObject interface to access the setState function
 */
export function setBaseClassState<T extends SceneObjectState>(sceneObject: SceneObject<T>, newState: Partial<T>) {
  sceneObject.setState(newState);
}
