import { SceneInteractionTracker, isInteractionTracker } from '../../behaviors/SceneInteractionTracker';
import { SceneObject } from '../types';

/**
 * Returns the closest query controller undefined if none found
 */
export function getInteractionTracker(sceneObject: SceneObject): SceneInteractionTracker | undefined {
  let parent: SceneObject | undefined = sceneObject;

  while (parent) {
    if (parent.state.$behaviors) {
      for (const behavior of parent.state.$behaviors) {
        if (isInteractionTracker(behavior)) {
          return behavior;
        }
      }
    }
    parent = parent.parent;
  }

  return undefined;
}
