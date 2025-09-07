import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { writeSceneLog } from '../utils/writeSceneLog';

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
  updateLongFrameMetrics(panelKey: string, count: number, duration: number): void;
  getPanelMetrics(panelKey: string): any;
}

export interface VizPanelRenderProfilerState extends SceneObjectState {
  /** Whether long frame detection is enabled */
  enableLongFrameDetection?: boolean;
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
  private _longFrameObserver?: PerformanceObserver;
  private _collector?: PanelPerformanceCollectorLike;

  public constructor(state: Partial<VizPanelRenderProfilerState> = {}) {
    super({
      enableLongFrameDetection: true,
      ...state,
    });

    this.addActivationHandler(() => {
      return this._onActivate();
    });
  }

  private _onActivate() {
    // Find VizPanel instances in the parent's children
    const panels = this._findPanels();

    if (panels.length === 0) {
      writeSceneLog('VizPanelRenderProfiler', 'No VizPanel found');
      return;
    }

    // Use provided collector from state
    this._collector = this.state.collector;

    if (!this._collector) {
      writeSceneLog('VizPanelRenderProfiler', 'No collector provided, profiling disabled');
      return;
    }

    // For now, just track the first panel found
    // In the future, we could track multiple panels
    const panel = panels[0];

    // Extract panel information
    this._panelKey = panel.state.key || `panel-${Date.now()}`;
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

    // Setup long frame detection if enabled
    if (this.state.enableLongFrameDetection) {
      this._setupLongFrameDetection();
    }

    writeSceneLog('VizPanelRenderProfiler', 'Activated for panel', this._panelKey);

    return () => {
      this._cleanup();
    };
  }

  private _findPanels(): VizPanel[] {
    if (!this.parent) {
      return [];
    }

    // If parent is a VizPanel, track that panel
    if (this.parent instanceof VizPanel) {
      return [this.parent];
    }

    // Otherwise, look for VizPanels in parent's children
    const panels: VizPanel[] = [];
    const parentState = (this.parent as any).state;

    if (parentState?.children) {
      for (const child of parentState.children) {
        if (child instanceof VizPanel) {
          panels.push(child);
        }
      }
    }

    return panels;
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
    if (!this._collector || !this._panelKey) {
      return;
    }

    if (!this._isTracking) {
      this._startTracking();
    }

    this._loadPluginStartTime = performance.now();
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.PluginLoad);

    writeSceneLog('VizPanelRenderProfiler', 'Plugin load started', pluginId);
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
    writeSceneLog('VizPanelRenderProfiler', 'Plugin load completed', duration, 'ms', fromCache ? '(from cache)' : '');
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

    writeSceneLog('VizPanelRenderProfiler', 'Query started');
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
    writeSceneLog('VizPanelRenderProfiler', 'Query completed', duration, 'ms');
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

    writeSceneLog('VizPanelRenderProfiler', 'Field config processing started');
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
    writeSceneLog('VizPanelRenderProfiler', 'Field config processing completed', duration, 'ms');
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
        writeSceneLog('VizPanelRenderProfiler', 'Panel render completed', duration, 'ms');
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

    writeSceneLog('VizPanelRenderProfiler', 'Plugin changed to', newPluginId);
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

    writeSceneLog('VizPanelRenderProfiler', 'Started tracking panel', this._panelKey);
  }

  /**
   * Setup long frame detection
   */
  private _setupLongFrameDetection() {
    if (!('PerformanceObserver' in window) || !('supportedEntryTypes' in PerformanceObserver)) {
      writeSceneLog('VizPanelRenderProfiler', 'Long frame detection not supported');
      return;
    }

    try {
      const supportedTypes = (PerformanceObserver as any).supportedEntryTypes;
      if (!supportedTypes.includes('long-animation-frame')) {
        writeSceneLog('VizPanelRenderProfiler', 'Long animation frames not supported');
        return;
      }

      this._longFrameObserver = new PerformanceObserver((list) => {
        if (!this._collector || !this._panelKey) {
          return;
        }

        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.duration > 50) {
            // Consider frames > 50ms as long
            this._collector.updateLongFrameMetrics(this._panelKey, 1, entry.duration);
          }
        }
      });

      this._longFrameObserver.observe({ entryTypes: ['long-animation-frame'] as any });
      writeSceneLog('VizPanelRenderProfiler', 'Long frame detection enabled');
    } catch (err) {
      writeSceneLog('VizPanelRenderProfiler', 'Failed to setup long frame detection', err);
    }
  }

  /**
   * Cleanup when behavior is deactivated
   */
  private _cleanup() {
    if (this._longFrameObserver) {
      this._longFrameObserver.disconnect();
      this._longFrameObserver = undefined;
    }

    this._isTracking = false;
    writeSceneLog('VizPanelRenderProfiler', 'Cleaned up for panel', this._panelKey);
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
