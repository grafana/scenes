import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { writeSceneLog } from '../utils/writeSceneLog';
import { sceneGraph } from '../core/sceneGraph';
import { SceneQueryControllerEntry } from './types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';
import { QueryProfilerLike } from '../querying/registerQueryWithController';
import { interactionBridge, CorrelationContext } from '@grafana/runtime';
import { getScenePerformanceTracker, generateOperationId } from './ScenePerformanceTracker';

// React Profiler phase type
type ReactProfilerPhase = 'mount' | 'update' | 'nested-update';

// Enum for panel lifecycle phases (matches Grafana's PanelPerformanceCollector)
export enum PanelLifecyclePhase {
  PluginLoad = 'pluginLoad',
  DataQuery = 'dataQuery',
  DataProcessing = 'dataProcessing',
  Render = 'render',
}

// Legacy PanelPerformanceCollectorLike interface removed - now uses unified collector

export interface VizPanelRenderProfilerState extends SceneObjectState {
  // State interface simplified - now uses unified collector internally
}

/**
 * Behavior that tracks performance metrics for individual VizPanel instances.
 * Uses the unified Enhanced Panel Performance Collector internally.
 * No external dependencies required - everything is handled automatically.
 *
 * Debug flags (controlled via localStorage):
 * - Render performance comparison: localStorage.setItem('scenes.debug.renderComparison', 'true')
 * - React Profiler: localStorage.setItem('scenes.debug.reactProfiler', 'true')
 *
 * To disable: localStorage.removeItem('scenes.debug.renderComparison')
 */
// Interface for type-safe behavior identification
export interface VizPanelRenderProfilerLike {
  readonly isVizPanelRenderProfiler: true;
  getPanelMetrics(): any;
}

export class VizPanelRenderProfiler extends SceneObjectBase<VizPanelRenderProfilerState> implements QueryProfilerLike {
  // Instance identifier for behavior type detection (minification-safe)
  public readonly isVizPanelRenderProfiler = true as const;
  private _panelKey?: string;
  private _panelId?: string;
  private _pluginId?: string;
  private _pluginVersion?: string;
  private _isTracking = false;
  private _loadPluginStartTime?: number;
  private _applyFieldConfigStartTime?: number;
  private _renderStartTime?: number;
  private _activeQueries = new Map<string, { entry: SceneQueryControllerEntry; startTime: number }>();

  // Store operation IDs for correlating performance events
  private _operationIds = new Map<string, string>();

  // S4.0: Store correlation context for metrics
  private _currentCorrelationContext: CorrelationContext | null = null;

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

    // Unified collector is now available via getter method - no setup needed

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

    // Panel tracking is now handled by observer pattern - no direct collector calls needed

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
   * Callback-based method for query tracking
   * Returns an end callback that handles both success and error cases with guaranteed operation ID correlation
   */
  public onQueryStarted(
    timestamp: number,
    entry: SceneQueryControllerEntry,
    queryId: string
  ): ((endTimestamp: number, error?: any) => void) | null {
    if (!this._panelKey) {
      return null;
    }

    this._activeQueries.set(queryId, { entry, startTime: timestamp });

    // Start the DataQuery phase if this is the first query
    if (this._activeQueries.size === 1) {
      this.updateCorrelationContext(); // S4.0: Store correlation for metrics

      // Performance marks now handled by Grafana ScenePerformanceService
    }

    // Generate operation ID for this specific query operation
    const operationId = generateOperationId('query');

    // Notify performance observers
    getScenePerformanceTracker().notifyQueryStart({
      operationId,
      panelId: this._panelId!,
      queryId: queryId,
      queryType: entry.type,
      timestamp,
    });

    // Return end callback with captured operationId and query context
    const callback = (endTimestamp: number, error?: any) => {
      if (!this._panelKey) {
        return;
      }

      const queryInfo = this._activeQueries.get(queryId);
      if (!queryInfo) {
        return;
      }

      const duration = endTimestamp - queryInfo.startTime;
      this._activeQueries.delete(queryId);

      // Notify performance observers using captured operation ID
      getScenePerformanceTracker().notifyQueryComplete({
        operationId, // ← Same operationId from closure!
        panelId: this._panelId!,
        queryId: queryId,
        queryType: entry.type,
        duration: duration,
        timestamp: endTimestamp,
        error: error ? error?.message || String(error) || 'Unknown error' : undefined,
      });

      const correlationContext = interactionBridge.getCorrelationContext();
      if (error) {
        this.logWithCorrelation(
          'Query error',
          {
            queryType: entry.type,
            queryId,
            duration,
            error: error?.message || String(error) || 'Unknown error',
            panelKey: this._panelKey,
            remainingQueriesCount: this._activeQueries.size,
          },
          correlationContext
        );
      } else {
        this.logWithCorrelation(
          'Query completed',
          {
            queryType: entry.type,
            queryId,
            duration,
            panelKey: this._panelKey,
            isLastQuery: this._activeQueries.size === 0,
            remainingQueriesCount: this._activeQueries.size,
          },
          correlationContext
        );
      }
    };

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Query started',
      {
        queryType: entry.type,
        queryId,
        panelKey: this._panelKey,
        activeQueriesCount: this._activeQueries.size,
        isFirstQuery: this._activeQueries.size === 1,
      },
      correlationContext
    );

    // Return the callback function
    return callback;
  }

  /**
   * Callback-based method for plugin loading
   * Returns an end callback that ensures proper operation ID correlation
   */
  public onPluginLoadStart(pluginId: string): ((plugin: any, fromCache?: boolean) => void) | null {
    // TIMING FIX: Plugin loading happens during VizPanel._onActivate(), which occurs BEFORE
    // the VizPanelRenderProfiler._onActivate() method runs. This means when onPluginLoadStart
    // is called, the profiler hasn't been fully initialized yet (no panelKey or collector).
    // We need to initialize these properties early to capture plugin loading metrics.
    if (!this._panelKey) {
      let panel: VizPanel | undefined;

      try {
        panel = sceneGraph.getAncestor(this, VizPanel);
      } catch (error) {
        // If we can't find the panel, we can't initialize - skip tracking
        return null;
      }

      // Initialize panel identification if not set yet
      // Only track panels that have a proper key - don't generate keys
      if (panel && !this._panelKey && panel.state.key) {
        this._panelKey = panel.state.key;
        this._panelId = String(panel.getLegacyPanelId());
        this._pluginId = pluginId;
      }

      // Unified collector is always available - no initialization needed
    }

    // Early return if we still don't have the required dependencies
    if (!this._panelKey) {
      return null;
    }

    if (!this._isTracking) {
      this._startTracking();
    }

    this._loadPluginStartTime = performance.now();
    this.updateCorrelationContext(); // S4.0: Store correlation for metrics

    // Generate operation ID for this specific plugin load operation
    const operationId = generateOperationId('pluginLoad');

    // Notify performance observers
    getScenePerformanceTracker().notifyPanelOperationStart({
      operationId,
      panelId: this._panelId!,
      panelKey: this._panelKey,
      pluginId: this._pluginId!,
      operation: 'pluginLoad',
      timestamp: this._loadPluginStartTime,
      metadata: { pluginId },
    });

    // Return end callback with captured operationId and panel context
    const callback = (plugin: any, fromCache = false) => {
      if (!this._panelKey || !this._loadPluginStartTime) {
        return;
      }

      const duration = performance.now() - this._loadPluginStartTime;

      // Notify performance observers using captured operation ID
      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId, // ← Same operationId from closure!
        panelId: this._panelId!,
        panelKey: this._panelKey,
        pluginId: this._pluginId!,
        operation: 'pluginLoad',
        timestamp: performance.now(),
        duration,
        metadata: { fromCache, pluginId: this._pluginId },
      });

      const correlationContext = interactionBridge.getCorrelationContext();
      this.logWithCorrelation(
        'Plugin load completed',
        {
          fromCache: fromCache,
          pluginId: this._pluginId,
          duration,
          panelKey: this._panelKey,
        },
        correlationContext
      );

      // Reset the start time
      this._loadPluginStartTime = undefined;
    };

    // STRUCTURED LOGGING: Use structured data format similar to SceneRenderProfiler
    // for consistent logging patterns and easier parsing/analysis
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Plugin load started',
      {
        pluginId: pluginId,
        panelKey: this._panelKey,
        // Performance marks now handled by Grafana ScenePerformanceService
      },
      correlationContext
    );

    // Return the callback function
    return callback;
  }

  /**
   * Callback-based method for field config processing
   * Returns an end callback that ensures proper operation ID correlation
   */
  public onFieldConfigStart(
    timestamp: number
  ): ((endTimestamp: number, dataPointsCount?: number, seriesCount?: number) => void) | null {
    if (!this._panelKey) {
      return null;
    }

    this._applyFieldConfigStartTime = timestamp;
    this.updateCorrelationContext(); // S4.0: Store correlation for metrics

    // Generate operation ID for this specific field config operation
    const operationId = generateOperationId('fieldConfig');

    // Notify performance observers
    getScenePerformanceTracker().notifyPanelOperationStart({
      operationId,
      panelId: this._panelId!,
      panelKey: this._panelKey,
      pluginId: this._pluginId!,
      operation: 'fieldConfig',
      timestamp: this._applyFieldConfigStartTime,
    });

    // Return end callback with captured operationId and panel context
    const callback = (endTimestamp: number, dataPointsCount?: number, seriesCount?: number) => {
      if (!this._panelKey || !this._applyFieldConfigStartTime) {
        return;
      }

      const duration = endTimestamp - this._applyFieldConfigStartTime;

      // Notify performance observers using captured operation ID
      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId, // ← Same operationId from closure!
        panelId: this._panelId!,
        panelKey: this._panelKey,
        pluginId: this._pluginId!,
        operation: 'fieldConfig',
        timestamp: endTimestamp,
        duration,
        metadata: { dataPointsCount, seriesCount },
      });

      // Get query count from the panel's SceneQueryRunner
      const queryCount = this._getQueryCount();

      const correlationContext = interactionBridge.getCorrelationContext();
      this.logWithCorrelation(
        'Field config processing completed',
        {
          duration: `${duration}ms`,
          dataPointsCount,
          seriesCount,
          queryCount,
        },
        correlationContext
      );

      // Reset the start time
      this._applyFieldConfigStartTime = undefined;
    };

    // Performance marks now handled by Grafana ScenePerformanceService

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
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Field config processing started',
      {
        phase: 'applyFieldConfig',
        panelState: panelState,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
        // Performance marks now handled by Grafana ScenePerformanceService
      },
      correlationContext
    );

    // Return the callback function
    return callback;
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

    return `VizPanelRenderProfiler [${panelTitle}]`;
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
    if (!this._panelKey) {
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

    this.logWithCorrelation(
      'React render completed',
      {
        phase: renderInfo.phase,
        actualDuration: renderInfo.actualDuration,
        baseDuration: renderInfo.baseDuration,
        startTime: renderInfo.startTime,
        commitTime: renderInfo.commitTime,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
      },
      this._currentCorrelationContext
    );

    // S5.0: Render metrics now handled by observer pattern
  }

  /**
   * S3.0 RENDER TRACKING: Simple render timing (component start to DOM update)
   * Returns a callback to end the render operation with guaranteed operation ID correlation
   */
  public onSimpleRenderStart(
    timestamp: number
  ): ((endTimestamp: number, duration: number, type: string) => void) | undefined {
    if (!this._panelKey) {
      return undefined;
    }

    // Store start time and begin render phase
    this._renderStartTime = timestamp;
    this.updateCorrelationContext(); // S4.0: Store correlation for metrics

    // Performance marks now handled by Grafana ScenePerformanceService

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Simple render started',
      {
        panelKey: this._panelKey,
        pluginId: this._pluginId,
        timestamp,
        // Performance marks now handled by Grafana ScenePerformanceService
      },
      correlationContext
    );

    // S5.0: Generate operation ID for lifecycle correlation (captured in closure)
    const operationId = generateOperationId('render');

    // Notify observers of panel lifecycle start
    getScenePerformanceTracker().notifyPanelLifecycleStart({
      operationId,
      panelId: this._panelId || 'unknown',
      panelKey: this._panelKey,
      pluginId: this._pluginId || 'unknown',
      pluginVersion: this._pluginVersion,
      operation: 'render',
      timestamp,
    });

    // Return end callback with captured operationId and panel context
    return (endTimestamp: number, duration: number, type: string) => {
      if (!this._panelKey) {
        return;
      }

      // Store for comparison - use the render start time for correlation
      this._lastSimpleRender = {
        duration,
        type,
        timestamp: this._renderStartTime || performance.now(), // Use render start time, not completion time
      };

      // Performance marks now handled by Grafana ScenePerformanceService

      const correlationContext = interactionBridge.getCorrelationContext();
      this.logWithCorrelation(
        'Simple render completed',
        {
          panelKey: this._panelKey,
          panelId: this._panelId,
          pluginId: this._pluginId,
          duration,
          type,
          correlationId: correlationContext?.interactionId,
          panelCount: this._getQueryCount(),
        },
        correlationContext
      );

      // S5.0: Notify observers of panel render completion using captured operation ID
      getScenePerformanceTracker().notifyPanelLifecycleComplete({
        operationId,
        panelId: this._panelId || 'unknown',
        panelKey: this._panelKey,
        pluginId: this._pluginId || 'unknown',
        pluginVersion: this._pluginVersion,
        operation: 'render',
        duration,
        timestamp: endTimestamp,
        metadata: { renderType: type },
      });

      this._renderStartTime = undefined;
    };
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
    if (!this._panelKey || !this._pluginId || this._isTracking) {
      return;
    }

    this.updateCorrelationContext(); // S4.0: Store correlation for metrics
    this._isTracking = true;

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Started tracking panel',
      {
        panelKey: this._panelKey,
        panelId: this._panelId,
        pluginId: this._pluginId,
        pluginVersion: this._pluginVersion,
      },
      correlationContext
    );
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
   * S3.1: Callback-based method for SceneDataTransformer to start transformation tracking
   * Returns an end callback that ensures proper operation ID correlation
   */
  public onDataTransformStart(
    timestamp: number,
    transformationId: string,
    metrics: {
      transformationCount: number;
      dataFrameCount: number;
      totalDataPoints: number;
      seriesTransformationCount: number;
      annotationTransformationCount: number;
    }
  ):
    | ((
        endTimestamp: number,
        duration: number,
        success: boolean,
        result?: {
          outputSeriesCount?: number;
          outputAnnotationsCount?: number;
          error?: string;
        }
      ) => void)
    | null {
    if (!this._panelKey) {
      return null;
    }

    // Generate operation ID for this specific transform operation
    const operationId = generateOperationId('transform');

    // Performance marks now handled by Grafana ScenePerformanceService
    getScenePerformanceTracker().notifyPanelOperationStart({
      operationId,
      panelId: this._panelId!,
      panelKey: this._panelKey,
      pluginId: this._pluginId!,
      operation: 'transform',
      timestamp,
      metadata: {
        transformationId,
        transformationCount: metrics.transformationCount,
        dataFrameCount: metrics.dataFrameCount,
        totalDataPoints: metrics.totalDataPoints,
      },
    });

    this.updateCorrelationContext(); // S4.0: Store correlation for metrics

    // Return end callback with captured operationId and panel context
    const callback = (
      endTimestamp: number,
      duration: number,
      success: boolean,
      result?: {
        outputSeriesCount?: number;
        outputAnnotationsCount?: number;
        error?: string;
      }
    ) => {
      if (!this._panelKey) {
        return;
      }

      // Notify performance observers using captured operation ID
      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId, // ← Same operationId from closure!
        panelId: this._panelId!,
        panelKey: this._panelKey,
        pluginId: this._pluginId!,
        operation: 'transform',
        timestamp: endTimestamp,
        duration,
        metadata: {
          transformationId,
          success,
          error: result?.error || !success,
          outputSeriesCount: result?.outputSeriesCount,
          outputAnnotationsCount: result?.outputAnnotationsCount,
        },
      });

      const correlationContext = interactionBridge.getCorrelationContext();
      if (success) {
        this.logWithCorrelation(
          'Data transformation completed',
          {
            transformationId,
            duration,
            outputSeriesCount: result?.outputSeriesCount,
            outputAnnotationsCount: result?.outputAnnotationsCount,
          },
          correlationContext
        );
      } else {
        this.logWithCorrelation(
          'Data transformation failed',
          {
            transformationId,
            duration,
            error: result?.error,
          },
          correlationContext
        );
      }
    };

    // Centralized logging in VizPanelRenderProfiler
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Data transformation started',
      {
        transformationId,
        transformationCount: metrics.transformationCount,
        dataFrameCount: metrics.dataFrameCount,
        totalDataPoints: metrics.totalDataPoints,
        seriesTransformationCount: metrics.seriesTransformationCount,
        annotationTransformationCount: metrics.annotationTransformationCount,
      },
      correlationContext
    );

    // Return the callback function
    return callback;
  }

  /**
   * S3.1: Public method for SceneDataTransformer to log manual reprocessing
   * S4.0: Enhanced with interaction correlation
   */
  public logManualReprocessing(): void {
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation('Manual data transformation reprocessing triggered', {}, correlationContext);
  }

  /**
   * S4.0: Update stored correlation context for metrics
   */
  private updateCorrelationContext(): void {
    this._currentCorrelationContext = interactionBridge.getCorrelationContext();
  }

  /**
   * Method removed - metrics are now handled by observer pattern instead of direct collector calls
   */

  /**
   * S4.0: Enhanced logging method with interaction correlation
   */
  private logWithCorrelation(
    message: string,
    data: Record<string, any>,
    correlationContext: CorrelationContext | null
  ): void {
    // Logging is currently disabled for performance - remove return to enable
    return;

    const panelInfo = this._getPanelInfo();

    if (correlationContext) {
      writeSceneLog(
        panelInfo,
        `[CORRELATION] Panel metric linked to dashboard interaction: ${correlationContext?.interactionType}`,
        {
          panelId: this._panelId,
          interactionId: correlationContext?.interactionId,
          interactionSource: correlationContext?.source,
          ...data,
        }
      );
    }

    writeSceneLog(panelInfo, message, data);
  }

  /**
   * Get the collected metrics for this panel
   * S4.0: Panel metrics are now handled by observer pattern - this method returns null
   */
  public getPanelMetrics() {
    // Panel metrics are now handled by observer pattern - no direct collector access needed
    return null;
  }
}
