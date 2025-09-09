import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler } from '../behaviors/VizPanelRenderProfiler';

/**
 * Utility function to find the VizPanelRenderProfiler for a given scene object.
 * This function traverses up the scene graph to find a VizPanel ancestor,
 * then looks for a VizPanelRenderProfiler behavior attached to it.
 *
 * @param sceneObject - The scene object to start the search from
 * @returns The VizPanelRenderProfiler if found, undefined otherwise
 */
export function findPanelProfiler(sceneObject: SceneObjectBase): VizPanelRenderProfiler | undefined {
  try {
    // Traverse up the scene graph to find a VizPanel
    const panel = sceneGraph.getAncestor(sceneObject, VizPanel);
    if (panel) {
      // Find VizPanelRenderProfiler behavior in the panel
      const behaviors = panel.state.$behaviors || [];
      return behaviors.find((b): b is VizPanelRenderProfiler => b instanceof VizPanelRenderProfiler);
    }
  } catch (error) {
    // If we can't find the panel or profiler, continue without tracking
  }
  return undefined;
}
