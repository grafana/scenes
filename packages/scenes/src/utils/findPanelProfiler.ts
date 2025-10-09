import { sceneGraph } from '../core/sceneGraph';
import { SceneObject } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler } from '../behaviors/VizPanelRenderProfiler';

/**
 * Find VizPanelRenderProfiler for a scene object by traversing up to find VizPanel ancestor.
 * @param sceneObject - Scene object to start search from
 * @returns VizPanelRenderProfiler if found, undefined otherwise
 */
export function findPanelProfiler(sceneObject: SceneObject): VizPanelRenderProfiler | undefined {
  try {
    const panel = sceneGraph.getAncestor(sceneObject, VizPanel);
    if (panel) {
      const behaviors = panel.state.$behaviors || [];
      return behaviors.find((b): b is VizPanelRenderProfiler => b instanceof VizPanelRenderProfiler);
    }
  } catch (error) {
    // Continue without tracking if panel not found
  }
  return undefined;
}
