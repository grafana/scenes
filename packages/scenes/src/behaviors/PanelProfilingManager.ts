import { Unsubscribable } from 'rxjs';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler } from './VizPanelRenderProfiler';
import { SceneObject } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';

export interface PanelProfilingConfig {
  watchStateKey?: string; // State property to watch for structural changes (e.g., 'body', 'children')
}

/**
 * Manages VizPanelRenderProfiler instances for all panels in a scene object.
 * Extracted from DashboardPanelProfilingBehavior to allow composition with SceneRenderProfiler.
 */
export class PanelProfilingManager {
  private _sceneObject?: SceneObject;
  private _subscriptions: Unsubscribable[] = [];

  public constructor(private _config: PanelProfilingConfig) {}

  /**
   * Attach panel profiling to a scene object
   */
  public attachToScene(sceneObject: SceneObject) {
    this._sceneObject = sceneObject;

    // Subscribe to scene state changes to add profilers to new panels
    const subscription = sceneObject.subscribeToState((newState: any, prevState: any) => {
      // If watchStateKey is specified, only react to changes in that specific property
      if (this._config.watchStateKey) {
        if (newState[this._config.watchStateKey] !== prevState[this._config.watchStateKey]) {
          this._attachProfilersToPanels();
        }
      } else {
        // Fallback: react to any state change
        this._attachProfilersToPanels();
      }
    });

    this._subscriptions.push(subscription);

    // Attach profilers to existing panels
    this._attachProfilersToPanels();
  }

  /**
   * Attach VizPanelRenderProfiler to all VizPanels that don't already have one
   */
  private _attachProfilersToPanels() {
    if (!this._sceneObject) {
      return;
    }

    // Use scene graph to find all VizPanels in the scene
    const panels = sceneGraph.findAllObjects(this._sceneObject, (obj) => obj instanceof VizPanel) as VizPanel[];

    panels.forEach((panel) => {
      // Check if profiler already exists
      const existingProfiler = panel.state.$behaviors?.find((b) => b instanceof VizPanelRenderProfiler);

      if (!existingProfiler) {
        // Add profiler behavior
        const profiler = new VizPanelRenderProfiler();

        panel.setState({
          $behaviors: [...(panel.state.$behaviors || []), profiler],
        });
      }
    });
  }

  /**
   * Clean up subscriptions and references
   */
  public cleanup() {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
    this._subscriptions = [];
    this._sceneObject = undefined;
  }
}
