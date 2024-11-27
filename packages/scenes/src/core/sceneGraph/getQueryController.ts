import { isQueryController } from '../../behaviors/SceneQueryController';
import { SceneQueryControllerLike } from '../../behaviors/types';
import { SceneObject } from '../types';

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
