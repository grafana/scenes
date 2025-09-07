import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { writeSceneLog } from '../utils/writeSceneLog';
import { sceneGraph } from '../core/sceneGraph';

// Enum for panel lifecycle phases
export enum PanelLifecyclePhase {
  PluginLoad = 'pluginLoad',
  DataQuery = 'dataQuery',
  DataProcessing = 'dataProcessing',
  Render = 'render',
}

// Interface for the panel performance collector
export interface PanelPerformanceCollectorLike {
  startPanelTracking(panelKey: string, panelId: string, pluginId: string, pluginVersion?: string): void;
  startPhase(panelKey: string, phase: string): void;
  endPhase(panelKey: string, phase: string): void;
  setPluginCacheStatus(panelKey: string, fromCache: boolean): void;
  setDataMetrics(panelKey: string, dataPointsCount?: number, seriesCount?: number): void;
  getPanelMetrics(panelKey: string): any;
}

export interface VizPanelRenderProfilerState extends SceneObjectState {
  /** Panel performance collector instance (required for profiling to work) */
  collector?: PanelPerformanceCollectorLike;
}

/**
 * Behavior that tracks performance metrics for individual VizPanel instances.
 * Requires a PanelPerformanceCollectorLike instance to be provided via state.collector.
 * The collector instance should be managed by the host application (e.g., Grafana).
 */
export class VizPanelRenderProfiler extends SceneObjectBase<VizPanelRenderProfilerState> {
  private _panelKey?: string;
  private _panelId?: string;
  private _pluginId?: string;
  private _pluginVersion?: string;
  private _isTracking = false;
  private _loadPluginStartTime?: number;
  private _applyFieldConfigStartTime?: number;
  private _queryStartTime?: number;
  private _renderStartTime?: number;
  private _collector?: PanelPerformanceCollectorLike;

  public constructor(state: Partial<VizPanelRenderProfilerState> = {}) {
    super({
      ...state,
    });

    this.addActivationHandler(() => {
      return this._onActivate();
    });
  }

  private _onActivate() {
    // This behavior is attached directly to a VizPanel
    let panel: VizPanel | undefined;

    try {
      panel = sceneGraph.getAncestor(this, VizPanel);
    } catch (error) {
      writeSceneLog('VizPanelRenderProfiler', 'Failed to find VizPanel ancestor', error);
      return;
    }

    if (!panel) {
      writeSceneLog('VizPanelRenderProfiler', 'Not attached to a VizPanel');
      return;
    }

    // Use provided collector from state
    this._collector = this.state.collector;

    if (!this._collector) {
      writeSceneLog('VizPanelRenderProfiler', 'No collector provided, profiling disabled');
      return;
    }

    // Extract panel information - only track panels with proper keys
    if (!panel.state.key) {
      writeSceneLog('VizPanelRenderProfiler', 'Panel has no key, skipping tracking');
      return;
    }

    this._panelKey = panel.state.key;
    this._panelId = String(panel.getLegacyPanelId());
    this._pluginId = panel.state.pluginId;
    const plugin = panel.getPlugin();
    this._pluginVersion = plugin?.meta?.info?.version;

    // Start tracking this panel in the collector
    this._collector.startPanelTracking(this._panelKey, this._panelId, this._pluginId, this._pluginVersion);

    // Subscribe to panel state changes to track lifecycle events
    this._subs.add(
      panel.subscribeToState((newState, prevState) => {
        this._handlePanelStateChange(panel, newState, prevState);
      })
    );

    return () => {
      this._cleanup();
    };
  }

  private _handlePanelStateChange(panel: VizPanel, newState: any, prevState: any) {
    // Track plugin changes
    if (newState.pluginId !== prevState.pluginId) {
      this._onPluginChange(panel, newState.pluginId);
    }

    // Track render counter changes (indicates re-render)
    if (newState._renderCounter !== prevState._renderCounter) {
      this._onPanelRender();
    }
  }

  /**
   * Called when plugin loading starts
   */
  public onPluginLoadStart(pluginId: string) {
    // TIMING FIX: Plugin loading happens during VizPanel._onActivate(), which occurs BEFORE
    // the VizPanelRenderProfiler._onActivate() method runs. This means when onPluginLoadStart
    // is called, the profiler hasn't been fully initialized yet (no panelKey or collector).
    // We need to initialize these properties early to capture plugin loading metrics.
    if (!this._panelKey || !this._collector) {
      let panel: VizPanel | undefined;

      try {
        panel = sceneGraph.getAncestor(this, VizPanel);
      } catch (error) {
        // If we can't find the panel, we can't initialize - skip tracking
        return;
      }

      // Initialize panel identification if not set yet
      // Only track panels that have a proper key - don't generate keys
      if (panel && !this._panelKey && panel.state.key) {
        this._panelKey = panel.state.key;
        this._panelId = String(panel.getLegacyPanelId());
        this._pluginId = pluginId;
      }

      // Initialize collector from behavior state if not set yet
      if (!this._collector) {
        this._collector = this.state.collector;
      }
    }

    // Early return if we still don't have the required dependencies
    if (!this._collector || !this._panelKey) {
      return;
    }

    if (!this._isTracking) {
      this._startTracking();
    }

    this._loadPluginStartTime = performance.now();
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.PluginLoad);

    // STRUCTURED LOGGING: Use structured data format similar to SceneRenderProfiler
    // for consistent logging patterns and easier parsing/analysis
    writeSceneLog(this._getPanelInfo(), 'Plugin load started', {
      pluginId: pluginId,
      panelKey: this._panelKey,
    });
  }

  /**
   * Called when plugin loading completes
   */
  public onPluginLoadEnd(plugin: any, fromCache = false) {
    if (!this._collector || !this._panelKey || !this._loadPluginStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.PluginLoad);
    this._collector.setPluginCacheStatus(this._panelKey, fromCache);

    const duration = performance.now() - this._loadPluginStartTime;
    // STRUCTURED LOGGING: Include timing and cache status for performance analysis
    writeSceneLog(this._getPanelInfo(), 'Plugin load completed', {
      duration: `${duration}ms`,
      fromCache: fromCache,
      pluginId: this._pluginId,
      panelKey: this._panelKey,
    });
  }

  /**
   * Called when query execution starts
   */
  public onQueryStart() {
    if (!this._collector || !this._panelKey) {
      return;
    }

    if (!this._isTracking) {
      this._startTracking();
    }

    this._queryStartTime = performance.now();
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.DataQuery);

    writeSceneLog(this._getPanelInfo(), 'Query started');
  }

  /**
   * Called when query execution completes
   */
  public onQueryEnd() {
    if (!this._collector || !this._panelKey || !this._queryStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.DataQuery);

    const duration = performance.now() - this._queryStartTime;
    writeSceneLog(this._getPanelInfo(), 'Query completed:', duration, 'ms');
  }

  /**
   * Called when field config processing starts
   */
  public onApplyFieldConfigStart() {
    if (!this._collector || !this._panelKey) {
      return;
    }

    this._applyFieldConfigStartTime = performance.now();
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.DataProcessing);

    // PANEL STATE DETECTION: Use sceneGraph.getData() to get current panel data state
    // This provides context about what state the panel is in when field config processing starts
    // (Loading, Done, Error, etc.) which is crucial for debugging panel loading issues
    let panelState = 'unknown';

    try {
      const panel = sceneGraph.getAncestor(this, VizPanel);
      if (panel) {
        const data = sceneGraph.getData(panel);
        panelState = data.state?.data?.state || 'no-data';
      }
    } catch (error) {
      // If we can't access the panel, keep panelState as 'unknown'
    }

    // STRUCTURED LOGGING: Include panel state and phase information for debugging
    writeSceneLog(this._getPanelInfo(), 'Field config processing started', {
      phase: 'applyFieldConfig',
      panelState: panelState,
      panelKey: this._panelKey,
      pluginId: this._pluginId,
    });
  }

  /**
   * Called when field config processing completes
   */
  public onApplyFieldConfigEnd(dataPointsCount?: number, seriesCount?: number) {
    if (!this._collector || !this._panelKey || !this._applyFieldConfigStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.DataProcessing);

    if (dataPointsCount !== undefined || seriesCount !== undefined) {
      this._collector.setDataMetrics(this._panelKey, dataPointsCount, seriesCount);
    }

    const duration = performance.now() - this._applyFieldConfigStartTime;
    writeSceneLog(this._getPanelInfo(), 'Field config processing completed (data processing phase):', duration, 'ms');
  }

  /**
   * Get panel information for logging with consistent format
   *
   * LOGGING FORMAT: Creates a consistent log prefix in the format:
   * "VizPanelRenderProfiler[PanelTitle]" where panel titles are truncated
   * to 30 characters to keep logs readable and prevent console overflow
   */
  private _getPanelInfo(): string {
    let panel: VizPanel | undefined;

    try {
      panel = sceneGraph.getAncestor(this, VizPanel);
    } catch (error) {
      // If we can't find the panel, use fallback info
    }

    let panelTitle = panel?.state.title || this._panelKey || 'No-key panel';

    // TITLE TRUNCATION: Limit panel titles to 30 characters with ellipsis
    // to maintain log readability while still providing panel identification
    if (panelTitle.length > 30) {
      panelTitle = panelTitle.substring(0, 27) + '...';
    }

    return `VizPanelRenderProfiler[${panelTitle}]`;
  }

  /**
   * Called when panel rendering starts
   */
  private _onPanelRender() {
    if (!this._collector || !this._panelKey) {
      return;
    }

    // End any previous render phase
    if (this._renderStartTime) {
      this._collector.endPhase(this._panelKey, PanelLifecyclePhase.Render);
    }

    this._renderStartTime = performance.now();
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.Render);

    // Schedule end of render phase after next frame
    requestAnimationFrame(() => {
      if (this._collector && this._panelKey && this._renderStartTime) {
        this._collector.endPhase(this._panelKey, PanelLifecyclePhase.Render);

        const duration = performance.now() - this._renderStartTime;
        writeSceneLog(
          'VizPanelRenderProfiler',
          `Panel render completed for panel ${this._getPanelInfo()}:`,
          duration,
          'ms'
        );
        this._renderStartTime = undefined;
      }
    });
  }

  /**
   * Handle plugin changes
   */
  private _onPluginChange(panel: VizPanel, newPluginId: string) {
    this._pluginId = newPluginId;
    const plugin = panel.getPlugin();
    this._pluginVersion = plugin?.meta?.info?.version;

    writeSceneLog(this._getPanelInfo(), `Plugin changed to ${newPluginId}`);
  }

  /**
   * Start tracking this panel
   */
  private _startTracking() {
    if (!this._collector || !this._panelKey || !this._pluginId || this._isTracking) {
      return;
    }

    this._collector.startPanelTracking(this._panelKey, this._panelId || '0', this._pluginId, this._pluginVersion);
    this._isTracking = true;

    writeSceneLog(this._getPanelInfo(), 'Started tracking panel');
  }

  /**
   * Cleanup when behavior is deactivated
   */
  private _cleanup() {
    this._isTracking = false;
    writeSceneLog(this._getPanelInfo(), 'Cleaned up');
  }

  /**
   * Get the collected metrics for this panel
   */
  public getPanelMetrics() {
    if (!this._collector || !this._panelKey) {
      return undefined;
    }

    return this._collector.getPanelMetrics(this._panelKey);
  }
}
