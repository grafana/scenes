import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { writeSceneLog } from '../utils/writeSceneLog';
import { sceneGraph } from '../core/sceneGraph';
import { SceneQueryControllerEntry } from './types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';

// React Profiler phase type
type ReactProfilerPhase = 'mount' | 'update' | 'nested-update';

// Enum for panel lifecycle phases (matches Grafana's PanelPerformanceCollector)
export enum PanelLifecyclePhase {
  PluginLoad = 'pluginLoad',
  DataQuery = 'dataQuery',
  DataProcessing = 'dataProcessing',
  Render = 'render',
}

// Interface that matches Grafana's PanelPerformanceCollector
export interface PanelPerformanceCollectorLike {
  startPanelTracking(panelKey: string, panelId: string, pluginId: string, pluginVersion?: string): void;
  startPhase(panelKey: string, phase: string): void;
  endPhase(panelKey: string, phase: string): void;
  setPluginCacheStatus(panelKey: string, fromCache: boolean): void;
  setDataMetrics(panelKey: string, dataPointsCount: number, seriesCount: number): void;
  updateLongFrameMetrics(panelKey: string, longFramesCount: number, longFramesTotalTime: number): void;
  recordError(panelKey: string, error: string): void;
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
 *
 * Debug flags (controlled via localStorage):
 * - Render performance comparison: localStorage.setItem('scenes.debug.renderComparison', 'true')
 * - React Profiler: localStorage.setItem('scenes.debug.reactProfiler', 'true')
 *
 * To disable: localStorage.removeItem('scenes.debug.renderComparison')
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
  private _activeQueries = new Map<string, { entry: SceneQueryControllerEntry; startTime: number }>();

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

    // S3.0 LIFECYCLE INTEGRATION: Panel profiler is now ready for query tracking
    // Query tracking will be handled via registerPanelQueryWithController callbacks

    return () => {
      this._cleanup();
    };
  }

  private _handlePanelStateChange(panel: VizPanel, newState: any, prevState: any) {
    // Track plugin changes
    if (newState.pluginId !== prevState.pluginId) {
      this._onPluginChange(panel, newState.pluginId);
    }

    // S3.0 LIFECYCLE INTEGRATION: Data source changes don't require re-setup
    // Query tracking is handled via registerPanelQueryWithController callbacks
  }

  /**
   * S3.0 LIFECYCLE INTEGRATION: Called by registerPanelQueryWithController when a query starts
   * This is the direct callback approach - no window events needed
   */
  public _onQueryStarted(entry: SceneQueryControllerEntry, queryId: string) {
    if (!this._collector || !this._panelKey) {
      return;
    }

    const startTime = performance.now();
    this._activeQueries.set(queryId, { entry, startTime });

    // Start the DataQuery phase if this is the first query
    if (this._activeQueries.size === 1) {
      this._collector.startPhase(this._panelKey, PanelLifecyclePhase.DataQuery);
      this._queryStartTime = startTime;

      // Performance mark for DevTools (only for the first query to avoid clutter)
      const startMark = `panel-query-start-${this._panelKey}`;
      performance.mark(startMark);
    }

    writeSceneLog(this._getPanelInfo(), 'Query started', {
      queryType: entry.type,
      queryId,
      panelKey: this._panelKey,
      activeQueriesCount: this._activeQueries.size,
      performanceMark: this._activeQueries.size === 1 ? `panel-query-start-${this._panelKey}` : undefined,
    });
  }

  /**
   * S3.0 LIFECYCLE INTEGRATION: Called by registerPanelQueryWithController when a query completes
   */
  public _onQueryCompleted(entry: SceneQueryControllerEntry, queryId: string) {
    if (!this._collector || !this._panelKey) {
      return;
    }

    const queryInfo = this._activeQueries.get(queryId);
    if (!queryInfo) {
      return;
    }

    const duration = performance.now() - queryInfo.startTime;
    this._activeQueries.delete(queryId);

    // End the DataQuery phase if this was the last query
    if (this._activeQueries.size === 0) {
      this._collector.endPhase(this._panelKey, PanelLifecyclePhase.DataQuery);

      // Performance marks and measure for DevTools (only when all queries complete)
      const endMark = `panel-query-end-${this._panelKey}`;
      const startMark = `panel-query-start-${this._panelKey}`;
      const measureName = `Panel Query - ${this._panelKey}`;

      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
    }

    writeSceneLog(this._getPanelInfo(), 'Query completed', {
      queryType: entry.type,
      queryId,
      duration,
      panelKey: this._panelKey,
      performanceMark: this._activeQueries.size === 0 ? `panel-query-end-${this._panelKey}` : undefined,
      performanceMeasure: this._activeQueries.size === 0 ? `Panel Query - ${this._panelKey}` : undefined,
      remainingQueriesCount: this._activeQueries.size,
    });
  }

  /**
   * S3.0 LIFECYCLE INTEGRATION: Called by registerPanelQueryWithController when a query errors
   */
  public _onQueryError(entry: SceneQueryControllerEntry, queryId: string, error: any) {
    if (!this._collector || !this._panelKey) {
      return;
    }

    const queryInfo = this._activeQueries.get(queryId);
    if (!queryInfo) {
      return;
    }

    const duration = performance.now() - queryInfo.startTime;
    this._activeQueries.delete(queryId);

    // End the DataQuery phase if this was the last query
    if (this._activeQueries.size === 0) {
      this._collector.endPhase(this._panelKey, PanelLifecyclePhase.DataQuery);
    }

    writeSceneLog(this._getPanelInfo(), 'Query error', {
      queryType: entry.type,
      queryId,
      duration,
      error: error?.message || String(error) || 'Unknown error',
      panelKey: this._panelKey,
      remainingQueriesCount: this._activeQueries.size,
    });
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

    // Performance mark for DevTools
    const startMark = `panel-plugin-load-start-${this._panelKey}`;
    performance.mark(startMark);

    // STRUCTURED LOGGING: Use structured data format similar to SceneRenderProfiler
    // for consistent logging patterns and easier parsing/analysis
    writeSceneLog(this._getPanelInfo(), 'Plugin load started', {
      pluginId: pluginId,
      panelKey: this._panelKey,
      performanceMark: startMark,
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

    // Performance marks and measure for DevTools
    const endMark = `panel-plugin-load-end-${this._panelKey}`;
    const startMark = `panel-plugin-load-start-${this._panelKey}`;
    const measureName = `Panel Plugin Load - ${this._panelKey}`;

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    // STRUCTURED LOGGING: Include timing and cache status for performance analysis
    writeSceneLog(this._getPanelInfo(), 'Plugin load completed', {
      duration: `${duration}ms`,
      fromCache: fromCache,
      pluginId: this._pluginId,
      panelKey: this._panelKey,
      performanceMark: endMark,
      performanceMeasure: measureName,
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

    // Performance mark for DevTools
    const startMark = `panel-field-config-start-${this._panelKey}`;
    performance.mark(startMark);

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
      performanceMark: startMark,
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

    if (dataPointsCount !== undefined && seriesCount !== undefined) {
      this._collector.setDataMetrics(this._panelKey, dataPointsCount, seriesCount);
    }

    const duration = performance.now() - this._applyFieldConfigStartTime;

    // Performance marks and measure for DevTools
    const endMark = `panel-field-config-end-${this._panelKey}`;
    const startMark = `panel-field-config-start-${this._panelKey}`;
    const measureName = `Panel Field Config - ${this._panelKey}`;

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    // Get query count from the panel's SceneQueryRunner
    const queryCount = this._getQueryCount();

    writeSceneLog(this._getPanelInfo(), 'Field config processing completed', {
      duration: `${duration}ms`,
      dataPointsCount,
      seriesCount,
      queryCount,
      panelKey: this._panelKey,
      pluginId: this._pluginId,
      performanceMark: endMark,
      performanceMeasure: measureName,
    });
  }

  /**
   * Get the number of queries from the panel's SceneQueryRunner
   */
  private _getQueryCount(): number {
    try {
      const panel = sceneGraph.getAncestor(this, VizPanel);
      if (!panel) {
        return 0;
      }

      const dataObject = sceneGraph.getData(panel);
      if (!dataObject) {
        return 0;
      }

      // Check if it's a SceneQueryRunner
      if (dataObject instanceof SceneQueryRunner) {
        return dataObject.state.queries?.length || 0;
      }

      // Check if it's a SceneDataTransformer wrapping a SceneQueryRunner
      if (dataObject instanceof SceneDataTransformer) {
        const innerDataSource = dataObject.state.$data;
        if (innerDataSource instanceof SceneQueryRunner) {
          return innerDataSource.state.queries?.length || 0;
        }
      }

      return 0;
    } catch (error) {
      return 0;
    }
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
   * S3.0 RENDER TRACKING: Called when panel render cycle starts
   * This is called from VizPanel.applyFieldConfig() which is invoked on every React render
   */
  public onRenderStart() {
    if (!this._collector || !this._panelKey) {
      return;
    }

    // End any previous render phase
    if (this._renderStartTime) {
      this._collector.endPhase(this._panelKey, PanelLifecyclePhase.Render);

      const prevDuration = performance.now() - this._renderStartTime;
      writeSceneLog(this._getPanelInfo(), 'Render completed (overlapping)', {
        duration: prevDuration,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
      });
    }

    this._renderStartTime = performance.now();
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.Render);

    writeSceneLog(this._getPanelInfo(), 'Render started', {
      panelKey: this._panelKey,
      pluginId: this._pluginId,
    });
  }

  // Store measurements for comparison
  private _lastReactRender?: {
    phase: string;
    actualDuration: number;
    baseDuration: number;
    startTime: number;
    commitTime: number;
    timestamp: number;
  };

  private _lastSimpleRender?: {
    duration: number;
    type: string;
    timestamp: number;
  };

  /**
   * S3.0 RENDER TRACKING: Called by React Profiler API with accurate render metrics (development only)
   */
  public onReactRender(renderInfo: {
    phase: ReactProfilerPhase;
    actualDuration: number;
    baseDuration: number;
    startTime: number;
    commitTime: number;
    panelId: string;
  }) {
    if (!this._collector || !this._panelKey) {
      return;
    }

    // Store for comparison - use React's startTime for correlation
    this._lastReactRender = {
      phase: renderInfo.phase,
      actualDuration: renderInfo.actualDuration,
      baseDuration: renderInfo.baseDuration,
      startTime: renderInfo.startTime,
      commitTime: renderInfo.commitTime,
      timestamp: renderInfo.startTime, // Use React's render start time, not current time
    };

    writeSceneLog(this._getPanelInfo(), 'React render completed', {
      phase: renderInfo.phase,
      actualDuration: renderInfo.actualDuration,
      baseDuration: renderInfo.baseDuration,
      startTime: renderInfo.startTime,
      commitTime: renderInfo.commitTime,
      panelKey: this._panelKey,
      pluginId: this._pluginId,
    });
  }

  /**
   * S3.0 RENDER TRACKING: Simple render timing (component start to DOM update)
   */
  public onSimpleRenderStart(startTime: number) {
    if (!this._collector || !this._panelKey) {
      return;
    }

    // Store start time and begin render phase
    this._renderStartTime = startTime;
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.Render);

    // Simple performance mark
    const startMark = `panel-simple-render-start-${this._panelKey}`;
    performance.mark(startMark);

    writeSceneLog(this._getPanelInfo(), 'Simple render started', {
      panelKey: this._panelKey,
      pluginId: this._pluginId,
      startTime,
      performanceMark: startMark,
    });
  }

  /**
   * S3.0 RENDER TRACKING: Simple render timing completion
   */
  public onSimpleRenderEnd(duration: number, type: string) {
    if (!this._collector || !this._panelKey) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.Render);

    // Store for comparison - use the render start time for correlation
    this._lastSimpleRender = {
      duration,
      type,
      timestamp: this._renderStartTime || performance.now(), // Use render start time, not completion time
    };

    // Simple performance mark and measure
    const endMark = `panel-simple-render-end-${this._panelKey}`;
    const startMark = `panel-simple-render-start-${this._panelKey}`;
    const measureName = `Panel Simple Render - ${this._panelKey}`;

    performance.mark(endMark);

    // Create measure if start mark exists
    try {
      const marks = performance.getEntriesByName(startMark, 'mark');
      if (marks.length > 0) {
        performance.measure(measureName, startMark, endMark);
      }
    } catch (error) {
      // Ignore performance API errors
    }

    writeSceneLog(this._getPanelInfo(), 'Simple render completed', {
      type,
      duration,
      panelKey: this._panelKey,
      pluginId: this._pluginId,
      performanceMark: endMark,
      performanceMeasure: measureName,
    });

    this._renderStartTime = undefined;
  }

  /**
   * S3.0 RENDER TRACKING: Compare React Profiler vs Simple Render measurements
   * Only runs when enabled via localStorage: localStorage.setItem('scenes.debug.renderComparison', 'true')
   */
  public compareRenderMeasurements(data: { reactProfiler: any }) {
    // Only run comparison if explicitly enabled via localStorage
    if (!localStorage.getItem('scenes.debug.renderComparison')) {
      return;
    }

    if (!this._lastReactRender || !this._lastSimpleRender) {
      return; // Need both measurements to compare
    }

    // More sophisticated correlation logic
    const timeDiff = Math.abs(this._lastReactRender.timestamp - this._lastSimpleRender.timestamp);
    const reactDuration = this._lastReactRender.actualDuration;
    const simpleDuration = this._lastSimpleRender.duration;

    // Skip comparison if measurements are clearly from different render cycles
    if (timeDiff > 10) {
      // Much tighter window - 10ms instead of 50ms for better correlation
      writeSceneLog(this._getPanelInfo(), '⏭️ Skipping comparison - measurements from different render cycles', {
        timeDiff: `${timeDiff.toFixed(2)}ms`,
        reactDuration: `${reactDuration.toFixed(2)}ms`,
        simpleDuration: `${simpleDuration.toFixed(2)}ms`,
        reactStartTime: this._lastReactRender.startTime.toFixed(2),
        simpleStartTime: this._lastSimpleRender.timestamp.toFixed(2),
        reactPhase: this._lastReactRender.phase,
      });
      return;
    }

    // Skip if React Profiler shows 0ms (likely a no-op render)
    if (reactDuration === 0) {
      writeSceneLog(this._getPanelInfo(), '⏭️ Skipping comparison - React Profiler shows 0ms (no-op render)', {
        reactPhase: this._lastReactRender.phase,
        simpleDuration: `${simpleDuration.toFixed(2)}ms`,
      });
      return;
    }

    const difference = simpleDuration - reactDuration;
    const percentDiff = ((difference / reactDuration) * 100).toFixed(1);

    // Create a comprehensive comparison summary
    const summary = {
      '🎯 RENDER MEASUREMENT COMPARISON': '━'.repeat(50),
      '📊 React Profiler (Official)': `${reactDuration.toFixed(2)}ms`,
      '🔧 Simple Measurement (Ours)': `${simpleDuration.toFixed(2)}ms`,
      '📈 Difference': `${difference > 0 ? '+' : ''}${difference.toFixed(2)}ms (${percentDiff}%)`,
      '📋 Analysis': this._analyzeRenderDifference(reactDuration, simpleDuration, difference),
      '🔍 Details': {
        reactPhase: this._lastReactRender.phase,
        reactBaseDuration: `${this._lastReactRender.baseDuration.toFixed(2)}ms`,
        simpleType: this._lastSimpleRender.type,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
      },
      '⏱️ Timing': {
        reactStart: this._lastReactRender.startTime.toFixed(2),
        reactCommit: this._lastReactRender.commitTime.toFixed(2),
        measurementGap: `${timeDiff.toFixed(2)}ms`,
      },
    };

    // Log the comparison with writeSceneLog for consistency
    writeSceneLog(this._getPanelInfo(), '🔬 RENDER MEASUREMENT COMPARISON', summary);

    // Clear measurements after comparison
    this._lastReactRender = undefined;
    this._lastSimpleRender = undefined;
  }

  private _analyzeRenderDifference(reactDuration: number, simpleDuration: number, difference: number): string {
    const absDiff = Math.abs(difference);
    const percentDiff = Math.abs((difference / reactDuration) * 100);

    if (absDiff < 1) {
      return '✅ Very close measurements - both approaches are accurate';
    } else if (simpleDuration > reactDuration) {
      if (percentDiff > 1000) {
        return '🚨 Simple measurement MUCH higher - likely measuring different render cycles or includes expensive operations';
      } else if (difference > 10) {
        return '⚠️ Simple measurement significantly higher - includes component function + hook execution overhead';
      } else if (difference > 2) {
        return '📊 Simple measurement higher - includes component function execution time';
      } else {
        return '✅ Simple measurement slightly higher - normal overhead from manual timing';
      }
    } else {
      if (percentDiff > 500) {
        return '🚨 React Profiler MUCH higher - measurements likely from different render cycles';
      } else if (Math.abs(difference) > 10) {
        return '🤔 React Profiler significantly higher - may indicate measurement timing mismatch';
      } else {
        return '📉 React Profiler slightly higher - normal variation in measurement timing';
      }
    }
  }

  /**
   * S3.0 RENDER TRACKING: Called when panel render cycle ends (legacy method)
   */
  public onRenderEnd(type: 'cached' | 'processed' | 'react-lifecycle') {
    if (!this._collector || !this._panelKey || !this._renderStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.Render);

    const duration = performance.now() - this._renderStartTime;
    writeSceneLog(this._getPanelInfo(), 'Render completed', {
      type,
      duration,
      panelKey: this._panelKey,
      pluginId: this._pluginId,
    });
    this._renderStartTime = undefined;
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
    // S3.0 LIFECYCLE INTEGRATION: Clear active queries on cleanup
    this._activeQueries.clear();

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
