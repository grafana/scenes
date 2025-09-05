import { SceneObject } from '../types';
import { SceneInteractionProfiler, isInteractionProfiler } from '../../behaviors/SceneInteractionProfiler';

/**
 * Returns the closest interaction profiler or undefined if none found
 */
export function getInteractionProfiler(sceneObject: SceneObject): SceneInteractionProfiler | undefined {
  let parent: SceneObject | undefined = sceneObject;

  while (parent) {
    if (parent.state.$behaviors) {
      for (const behavior of parent.state.$behaviors) {
        if (isInteractionProfiler(behavior)) {
          return behavior;
        }
      }
    }
    parent = parent.parent;
  }

  return undefined;
}
