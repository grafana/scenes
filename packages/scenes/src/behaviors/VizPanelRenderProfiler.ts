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
import { getEnhancedPanelPerformanceCollector } from '../services/PanelPerformanceCollector';

// React Profiler phase type
type ReactProfilerPhase = 'mount' | 'update' | 'nested-update';

// S5.0: Hybrid panel metrics types - totals for dashboard + details for analysis
export interface BasePanelMetrics {
  panelId?: string;
  panelKey?: string;
  pluginId?: string;
  pluginVersion?: string;
  correlationContext?: CorrelationContext | null;
}

// Individual operation details
export interface FieldConfigOperation {
  duration: number;
  timestamp: number;
  dataPointsCount?: number;
  seriesCount?: number;
}

export interface TransformationOperation {
  duration: number;
  timestamp: number;
  transformationId: string; // Transformation types: "organize+calculate" or "customTransformation"
  outputSeriesCount?: number;
  outputAnnotationsCount?: number;
}

export interface RenderOperation {
  duration: number;
  timestamp: number;
  type: string;
}

export interface QueryOperation {
  duration: number;
  timestamp: number;
  queryType: string;
  queryId: string;
}

// Hybrid metrics with totals + details
export interface PluginLoadMetrics extends BasePanelMetrics {
  pluginLoadTime: number;
  pluginLoadedFromCache: boolean;
}

export interface QueryMetrics extends BasePanelMetrics {
  // Summary totals
  totalQueryTime?: number;
  queryCount?: number;
  // Detailed operations
  queryOperations?: QueryOperation[];
}

export interface FieldConfigMetrics extends BasePanelMetrics {
  // Summary totals
  totalFieldConfigTime?: number;
  fieldConfigCount?: number;
  // Detailed operations
  fieldConfigOperations?: FieldConfigOperation[];
  // Latest data context
  dataPointsCount?: number;
  seriesCount?: number;
}

export interface TransformationMetrics extends BasePanelMetrics {
  // Summary totals
  totalTransformationTime?: number;
  transformationCount?: number;
  // Detailed operations
  transformationOperations?: TransformationOperation[];
}

export interface RenderMetrics extends BasePanelMetrics {
  // Summary totals
  totalRenderTime?: number;
  renderCount?: number;
  // Detailed operations
  renderOperations?: RenderOperation[];
}

// Union type for all possible incremental metrics
export type IncrementalPanelMetrics =
  | BasePanelMetrics
  | PluginLoadMetrics
  | QueryMetrics
  | FieldConfigMetrics
  | TransformationMetrics
  | RenderMetrics;

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
  private _queryStartTime?: number;
  private _renderStartTime?: number;
  private _activeQueries = new Map<string, { entry: SceneQueryControllerEntry; startTime: number }>();

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

  /**
   * Get the unified collector instance
   */
  private get _collector() {
    return getEnhancedPanelPerformanceCollector();
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
    if (!this._panelKey) {
      return;
    }

    const startTime = performance.now();
    this._activeQueries.set(queryId, { entry, startTime });

    // Start the DataQuery phase if this is the first query
    if (this._activeQueries.size === 1) {
      this.updateCorrelationContext(); // S4.0: Store correlation for metrics
      this._collector.startPhase(this._panelKey, PanelLifecyclePhase.DataQuery);
      this._queryStartTime = startTime;

      // Performance mark for DevTools (only for the first query to avoid clutter)
      const startMark = `panel-query-start-${this._panelKey}`;
      performance.mark(startMark);
    }

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Query started',
      {
        queryType: entry.type,
        queryId,
        panelKey: this._panelKey,
        activeQueriesCount: this._activeQueries.size,
        performanceMark: this._activeQueries.size === 1 ? `panel-query-start-${this._panelKey}` : undefined,
      },
      correlationContext
    );
  }

  /**
   * S3.0 LIFECYCLE INTEGRATION: Called by registerPanelQueryWithController when a query completes
   */
  public _onQueryCompleted(entry: SceneQueryControllerEntry, queryId: string) {
    if (!this._panelKey) {
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

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Query completed',
      {
        queryType: entry.type,
        queryId,
        duration,
        panelKey: this._panelKey,
        performanceMark: this._activeQueries.size === 0 ? `panel-query-end-${this._panelKey}` : undefined,
        performanceMeasure: this._activeQueries.size === 0 ? `Panel Query - ${this._panelKey}` : undefined,
        remainingQueriesCount: this._activeQueries.size,
      },
      correlationContext
    );

    // S5.0: Register query completion metrics (hybrid approach)
    if (this._activeQueries.size === 0) {
      const queryMetrics: QueryMetrics = {
        queryOperations: [
          {
            duration,
            timestamp: performance.now(),
            queryType: entry.type,
            queryId,
          },
        ],
        correlationContext: this._currentCorrelationContext,
      };
      this.registerWithUnifiedCollector(queryMetrics);
    }
  }

  /**
   * S3.0 LIFECYCLE INTEGRATION: Called by registerPanelQueryWithController when a query errors
   */
  public _onQueryError(entry: SceneQueryControllerEntry, queryId: string, error: any) {
    if (!this._panelKey) {
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

    const correlationContext = interactionBridge.getCorrelationContext();
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
  }

  /**
   * Called when plugin loading starts
   */
  public onPluginLoadStart(pluginId: string) {
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
        return;
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
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Plugin load started',
      {
        pluginId: pluginId,
        panelKey: this._panelKey,
        performanceMark: startMark,
      },
      correlationContext
    );
  }

  /**
   * Called when plugin loading completes
   */
  public onPluginLoadEnd(plugin: any, fromCache = false) {
    if (!this._panelKey || !this._loadPluginStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.PluginLoad);
    this._collector.setPluginCacheStatus(this._panelKey, fromCache);

    const duration = performance.now() - this._loadPluginStartTime;

    // S5.0: Complete plugin load phase using helper method
    this.completePhase(
      'plugin-load',
      this._loadPluginStartTime!,
      {
        fromCache: fromCache,
        pluginId: this._pluginId,
      },
      {
        panelId: this._panelId,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
        pluginVersion: this._pluginVersion,
        pluginLoadTime: duration,
        pluginLoadedFromCache: fromCache,
      } as PluginLoadMetrics
    );
  }

  /**
   * Called when query execution starts
   */
  public onQueryStart() {
    if (!this._panelKey) {
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
    if (!this._panelKey || !this._queryStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.DataQuery);

    const duration = performance.now() - this._queryStartTime;
    writeSceneLog(this._getPanelInfo(), 'Query completed:', duration, 'ms');
  }

  /**
   * Called when field config processing starts
   */
  public onFieldConfigStart() {
    if (!this._panelKey) {
      return;
    }

    this._applyFieldConfigStartTime = performance.now();
    this.updateCorrelationContext(); // S4.0: Store correlation for metrics
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
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Field config processing started',
      {
        phase: 'applyFieldConfig',
        panelState: panelState,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
        performanceMark: startMark,
      },
      correlationContext
    );
  }

  /**
   * Called when field config processing completes
   */
  public onFieldConfigEnd(dataPointsCount?: number, seriesCount?: number) {
    if (!this._panelKey || !this._applyFieldConfigStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.DataProcessing);

    if (dataPointsCount !== undefined && seriesCount !== undefined) {
      this._collector.setDataMetrics(this._panelKey, dataPointsCount, seriesCount);
    }

    const duration = performance.now() - this._applyFieldConfigStartTime;

    // Get query count from the panel's SceneQueryRunner
    const queryCount = this._getQueryCount();

    // S5.0: Register field config completion (hybrid approach)
    const fieldConfigMetrics: FieldConfigMetrics = {
      fieldConfigOperations: [
        {
          duration,
          timestamp: performance.now(),
          dataPointsCount,
          seriesCount,
        },
      ],
      dataPointsCount, // Keep latest data context
      seriesCount,
      correlationContext: this._currentCorrelationContext,
    };
    this.registerWithUnifiedCollector(fieldConfigMetrics);

    // Performance marks and logging
    const endMark = `panel-field-config-end-${this._panelKey}`;
    const startMark = `panel-field-config-start-${this._panelKey}`;
    const measureName = `Panel Field Config - ${this._panelKey}`;

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Field config processing completed',
      {
        duration: `${duration}ms`,
        dataPointsCount,
        seriesCount,
        queryCount,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
        performanceMark: endMark,
        performanceMeasure: measureName,
      },
      correlationContext
    );
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

  /**
   * S3.0 RENDER TRACKING: Called when panel render cycle starts
   * This is called from VizPanel.applyFieldConfig() which is invoked on every React render
   */
  public onRenderStart() {
    if (!this._panelKey) {
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
    this.updateCorrelationContext(); // S4.0: Store correlation for metrics
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.Render);

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Render started',
      {
        panelKey: this._panelKey,
        pluginId: this._pluginId,
      },
      correlationContext
    );
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

    // S5.0: Register render completion metrics (incremental)
    const renderMetrics: RenderMetrics = {
      totalRenderTime: renderInfo.actualDuration, // Use actual React render duration
      renderCount: (this._collector.getPanelMetrics(this._panelKey)?.renderCount || 0) + 1,
      correlationContext: this._currentCorrelationContext,
    };
    this.registerWithUnifiedCollector(renderMetrics);
  }

  /**
   * S3.0 RENDER TRACKING: Simple render timing (component start to DOM update)
   */
  public onSimpleRenderStart(startTime: number) {
    if (!this._panelKey) {
      return;
    }

    // Store start time and begin render phase
    this._renderStartTime = startTime;
    this.updateCorrelationContext(); // S4.0: Store correlation for metrics
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.Render);

    // Simple performance mark
    const startMark = `panel-simple-render-start-${this._panelKey}`;
    performance.mark(startMark);

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Simple render started',
      {
        panelKey: this._panelKey,
        pluginId: this._pluginId,
        startTime,
        performanceMark: startMark,
      },
      correlationContext
    );
  }

  /**
   * S3.0 RENDER TRACKING: Simple render timing completion
   */
  public onSimpleRenderEnd(duration: number, type: string) {
    if (!this._panelKey) {
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

    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Simple render completed',
      {
        type,
        duration,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
        performanceMark: endMark,
        performanceMeasure: measureName,
      },
      correlationContext
    );

    // S5.0: Register simple render completion (hybrid approach)
    const simpleRenderMetrics: RenderMetrics = {
      renderOperations: [
        {
          duration,
          timestamp: performance.now(),
          type,
        },
      ],
      correlationContext: this._currentCorrelationContext,
    };
    this.registerWithUnifiedCollector(simpleRenderMetrics);

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
    if (!this._panelKey || !this._renderStartTime) {
      return;
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.Render);

    const duration = performance.now() - this._renderStartTime;
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      'Render completed',
      {
        type,
        duration,
        panelKey: this._panelKey,
        pluginId: this._pluginId,
      },
      correlationContext
    );
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
    if (!this._panelKey || !this._pluginId || this._isTracking) {
      return;
    }

    this.updateCorrelationContext(); // S4.0: Store correlation for metrics
    this._collector.startPanelTracking(this._panelKey, this._panelId || '0', this._pluginId, this._pluginVersion);
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
   * S3.1: Public method for SceneDataTransformer to start transformation tracking
   */
  public onDataTransformStart(
    transformationId: string,
    metrics: {
      transformationCount: number;
      dataFrameCount: number;
      totalDataPoints: number;
      seriesTransformationCount: number;
      annotationTransformationCount: number;
    }
  ): void {
    if (!this._panelKey) {
      return;
    }

    // Add performance mark for DevTools
    try {
      performance.mark(`transformation-start-${transformationId}`);
    } catch (e) {
      // Performance marks might not be available in all environments
    }

    this.updateCorrelationContext(); // S4.0: Store correlation for metrics
    this._collector.startPhase(this._panelKey, PanelLifecyclePhase.DataProcessing);

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
  }

  /**
   * S3.1: Public method for SceneDataTransformer to end transformation tracking
   */
  public onDataTransformEnd(
    transformationId: string,
    duration: number,
    success: boolean,
    result?: {
      outputSeriesCount?: number;
      outputAnnotationsCount?: number;
      error?: string;
    }
  ): void {
    if (!this._panelKey) {
      return;
    }

    // Add performance mark for DevTools
    const markSuffix = success ? 'end' : 'error';
    try {
      performance.mark(`transformation-${markSuffix}-${transformationId}`);
      performance.measure(
        `transformation-duration-${transformationId}`,
        `transformation-start-${transformationId}`,
        `transformation-${markSuffix}-${transformationId}`
      );
    } catch (e) {
      // Performance marks might not be available in all environments
    }

    this._collector.endPhase(this._panelKey, PanelLifecyclePhase.DataProcessing);

    // Centralized logging in VizPanelRenderProfiler
    const correlationContext = interactionBridge.getCorrelationContext();
    if (success) {
      this.logWithCorrelation(
        'Data transformation completed',
        {
          transformationId,
          duration: `${duration.toFixed(2)}ms`,
          outputSeriesCount: result?.outputSeriesCount,
          outputAnnotationsCount: result?.outputAnnotationsCount,
        },
        correlationContext
      );

      // S5.0: Register successful transformation completion (hybrid approach)
      const transformMetrics: TransformationMetrics = {
        transformationOperations: [
          {
            duration,
            timestamp: performance.now(),
            transformationId,
            outputSeriesCount: result?.outputSeriesCount,
            outputAnnotationsCount: result?.outputAnnotationsCount,
          },
        ],
        correlationContext: this._currentCorrelationContext,
      };
      this.registerWithUnifiedCollector(transformMetrics);
    } else {
      this.logWithCorrelation(
        'Data transformation failed',
        {
          transformationId,
          duration: `${duration.toFixed(2)}ms`,
          error: result?.error,
        },
        correlationContext
      );

      // S5.0: Register failed transformation (hybrid approach)
      const transformMetrics: TransformationMetrics = {
        transformationOperations: [
          {
            duration,
            timestamp: performance.now(),
            transformationId,
            outputSeriesCount: 0,
            outputAnnotationsCount: 0,
          },
        ],
        correlationContext: this._currentCorrelationContext,
      };
      this.registerWithUnifiedCollector(transformMetrics);
    }
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
   * S5.0: Helper method to complete a performance phase with measurement, logging, and registration
   */
  private completePhase(
    phase: string,
    startTime: number,
    logData: Record<string, any>,
    incrementalMetrics: IncrementalPanelMetrics
  ): void {
    const duration = performance.now() - startTime;

    // Performance marks and measures
    const endMark = `panel-${phase}-end-${this._panelKey}`;
    const startMark = `panel-${phase}-start-${this._panelKey}`;
    const measureName = `Panel ${phase} - ${this._panelKey}`;

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    // Correlation and logging
    const correlationContext = interactionBridge.getCorrelationContext();
    this.logWithCorrelation(
      `${phase} completed`,
      {
        duration: `${duration}ms`,
        ...logData,
        panelKey: this._panelKey,
        performanceMark: endMark,
        performanceMeasure: measureName,
      },
      correlationContext
    );

    // S5.0: Register incremental metrics
    this.registerWithUnifiedCollector({
      ...incrementalMetrics,
      correlationContext: this._currentCorrelationContext,
    });
  }

  /**
   * Unified: Register metrics with the unified Enhanced Panel Performance Collector
   */
  private registerWithUnifiedCollector(incrementalMetrics?: IncrementalPanelMetrics): void {
    if (!this._panelKey) {
      return;
    }

    try {
      const collector = getEnhancedPanelPerformanceCollector();

      // Ensure panel is tracked
      if (!collector.isPanelTracked(this._panelKey)) {
        collector.startPanelTracking(this._panelKey, this._panelId || '', this._pluginId || '', this._pluginVersion);
      }

      // Set correlation context
      collector.setCorrelationContext(this._panelKey, this._currentCorrelationContext);

      // Register specific operation based on incrementalMetrics type
      if (incrementalMetrics) {
        if ('queryOperations' in incrementalMetrics && incrementalMetrics.queryOperations) {
          incrementalMetrics.queryOperations.forEach((op) => collector.registerQueryOperation(this._panelKey!, op));
        }
        if ('fieldConfigOperations' in incrementalMetrics && incrementalMetrics.fieldConfigOperations) {
          incrementalMetrics.fieldConfigOperations.forEach((op) =>
            collector.registerFieldConfigOperation(this._panelKey!, op)
          );
        }
        if ('transformationOperations' in incrementalMetrics && incrementalMetrics.transformationOperations) {
          incrementalMetrics.transformationOperations.forEach((op) =>
            collector.registerTransformationOperation(this._panelKey!, op)
          );
        }
        if ('renderOperations' in incrementalMetrics && incrementalMetrics.renderOperations) {
          incrementalMetrics.renderOperations.forEach((op) => collector.registerRenderOperation(this._panelKey!, op));
        }
      }
    } catch (error) {
      writeSceneLog('VizPanelRenderProfiler', 'Failed to register with unified collector:', error);
    }
  }

  /**
   * S4.0: Enhanced logging method with interaction correlation
   */
  private logWithCorrelation(
    message: string,
    data: Record<string, any>,
    correlationContext: CorrelationContext | null
  ): void {
    const panelInfo = this._getPanelInfo();

    if (correlationContext) {
      writeSceneLog(
        panelInfo,
        `[CORRELATION] Panel metric linked to dashboard interaction: ${correlationContext.interactionType}`,
        {
          panelId: this._panelId,
          interactionId: correlationContext.interactionId,
          interactionSource: correlationContext.source,
          ...data,
        }
      );
    }

    writeSceneLog(panelInfo, message, data);
  }

  /**
   * Get the collected metrics for this panel
   * S4.0: Enhanced with correlation context
   */
  public getPanelMetrics() {
    if (!this._panelKey) {
      return undefined;
    }

    const baseMetrics = this._collector.getPanelMetrics(this._panelKey);

    // S4.0: Enhance metrics with correlation context if available
    if (this._currentCorrelationContext && baseMetrics) {
      return {
        ...baseMetrics,
        correlationContext: {
          interactionId: this._currentCorrelationContext.interactionId,
          interactionType: this._currentCorrelationContext.interactionType,
          interactionSource: this._currentCorrelationContext.source,
          interactionStartTime: this._currentCorrelationContext.startTime,
          // Keep the original panel metrics
          panelId: this._panelId,
          panelKey: this._panelKey,
        },
      };
    }

    return baseMetrics;
  }
}
