import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { writeSceneLog } from '../utils/writeSceneLog';
import { sceneGraph } from '../core/sceneGraph';
import { SceneQueryControllerEntry } from './types';
import { QueryProfilerLike } from '../querying/registerQueryWithController';
import { getScenePerformanceTracker, generateOperationId } from './ScenePerformanceTracker';

export interface VizPanelRenderProfilerState extends SceneObjectState {}

/**
 * Tracks performance metrics for individual VizPanel instances using observer pattern.
 *
 * Performance events are sent to ScenePerformanceTracker observers, which are consumed
 * by Grafana's ScenePerformanceLogger and DashboardAnalyticsAggregator.
 */

export class VizPanelRenderProfiler extends SceneObjectBase<VizPanelRenderProfilerState> implements QueryProfilerLike {
  private _panelKey?: string;
  private _panelId?: string;
  private _pluginId?: string;
  private _pluginVersion?: string;
  private _isTracking = false;
  private _loadPluginStartTime?: number;
  private _applyFieldConfigStartTime?: number;
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

    if (!panel.state.key) {
      writeSceneLog('VizPanelRenderProfiler', 'Panel has no key, skipping tracking');
      return;
    }

    this._panelKey = panel.state.key;
    this._panelId = String(panel.getLegacyPanelId());
    this._pluginId = panel.state.pluginId;
    const plugin = panel.getPlugin();
    this._pluginVersion = plugin?.meta?.info?.version;

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
    if (newState.pluginId !== prevState.pluginId) {
      this._onPluginChange(panel, newState.pluginId);
    }
  }

  /**
   * Track query execution with operation ID correlation
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

    const operationId = generateOperationId('query');

    // ✅ Use panel operation tracking for panel queries
    getScenePerformanceTracker().notifyPanelOperationStart({
      operationId,
      panelId: this._panelId!,
      panelKey: this._panelKey,
      pluginId: this._pluginId!,
      pluginVersion: this._pluginVersion,
      operation: 'query',
      timestamp,
      metadata: {
        queryId: queryId,
        queryType: entry.type,
      },
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

      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId,
        panelId: this._panelId!,
        panelKey: this._panelKey,
        pluginId: this._pluginId!,
        pluginVersion: this._pluginVersion,
        operation: 'query',
        timestamp: endTimestamp,
        duration: duration,
        metadata: {
          queryId: queryId,
          queryType: entry.type,
        },
        error: error ? error?.message || String(error) || 'Unknown error' : undefined,
      });
    };
    return callback;
  }

  /**
   * Track plugin loading with operation ID correlation
   */
  public onPluginLoadStart(pluginId: string): ((plugin: any, fromCache?: boolean) => void) | null {
    // Initialize early since plugin loading happens before _onActivate
    if (!this._panelKey) {
      let panel: VizPanel | undefined;

      try {
        panel = sceneGraph.getAncestor(this, VizPanel);
      } catch (error) {
        return null;
      }

      if (panel && !this._panelKey && panel.state.key) {
        this._panelKey = panel.state.key;
        this._panelId = String(panel.getLegacyPanelId());
        this._pluginId = pluginId;
      }
    }

    if (!this._panelKey) {
      return null;
    }

    if (!this._isTracking) {
      this._startTracking();
    }

    this._loadPluginStartTime = performance.now();

    const operationId = generateOperationId('pluginLoad');
    getScenePerformanceTracker().notifyPanelOperationStart({
      operationId,
      panelId: this._panelId!,
      panelKey: this._panelKey,
      pluginId: this._pluginId!,
      operation: 'plugin-load',
      timestamp: this._loadPluginStartTime,
      metadata: {
        pluginId,
      },
    });

    // Return end callback with captured operationId and panel context
    const callback = (plugin: any, fromCache = false) => {
      if (!this._panelKey || !this._loadPluginStartTime) {
        return;
      }

      const duration = performance.now() - this._loadPluginStartTime;

      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId,
        panelId: this._panelId!,
        panelKey: this._panelKey,
        pluginId: this._pluginId!,
        operation: 'plugin-load',
        timestamp: performance.now(),
        duration,
        metadata: {
          pluginId: this._pluginId!,
          fromCache,
          pluginLoadTime: duration,
        },
      });

      this._loadPluginStartTime = undefined;
    };
    return callback;
  }

  /**
   * Track field config processing with operation ID correlation
   */
  public onFieldConfigStart(
    timestamp: number
  ): ((endTimestamp: number, dataPointsCount?: number, seriesCount?: number) => void) | null {
    if (!this._panelKey) {
      return null;
    }

    this._applyFieldConfigStartTime = timestamp;

    const operationId = generateOperationId('fieldConfig');
    getScenePerformanceTracker().notifyPanelOperationStart({
      operationId,
      panelId: this._panelId!,
      panelKey: this._panelKey,
      pluginId: this._pluginId!,
      operation: 'fieldConfig',
      timestamp: this._applyFieldConfigStartTime,
      metadata: {
        // Initial metadata - will be updated on completion with actual counts
      },
    });

    // Return end callback with captured operationId and panel context
    const callback = (endTimestamp: number, dataPointsCount?: number, seriesCount?: number) => {
      if (!this._panelKey || !this._applyFieldConfigStartTime) {
        return;
      }

      const duration = endTimestamp - this._applyFieldConfigStartTime;

      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId,
        panelId: this._panelId!,
        panelKey: this._panelKey,
        pluginId: this._pluginId!,
        operation: 'fieldConfig',
        timestamp: endTimestamp,
        duration,
        metadata: {},
      });

      this._applyFieldConfigStartTime = undefined;
    };
    return callback;
  }

  /**
   * Get panel info for logging - truncates long titles for readability
   */
  private _getPanelInfo(): string {
    let panel: VizPanel | undefined;

    try {
      panel = sceneGraph.getAncestor(this, VizPanel);
    } catch (error) {
      // If we can't find the panel, use fallback info
    }

    let panelTitle = panel?.state.title || this._panelKey || 'No-key panel';

    if (panelTitle.length > 30) {
      panelTitle = panelTitle.substring(0, 27) + '...';
    }

    return `VizPanelRenderProfiler [${panelTitle}]`;
  }

  /**
   * Track simple render timing with operation ID correlation
   */
  public onSimpleRenderStart(timestamp: number): ((endTimestamp: number, duration: number) => void) | undefined {
    if (!this._panelKey) {
      return undefined;
    }

    const operationId = generateOperationId('render');
    getScenePerformanceTracker().notifyPanelOperationStart({
      operationId,
      panelId: this._panelId || 'unknown',
      panelKey: this._panelKey,
      pluginId: this._pluginId || 'unknown',
      pluginVersion: this._pluginVersion,
      operation: 'render',
      timestamp,
      metadata: {},
    });

    // Return end callback with captured operationId and panel context
    return (endTimestamp: number, duration: number) => {
      if (!this._panelKey) {
        return;
      }

      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId,
        panelId: this._panelId || 'unknown',
        panelKey: this._panelKey,
        pluginId: this._pluginId || 'unknown',
        pluginVersion: this._pluginVersion,
        operation: 'render',
        duration,
        timestamp: endTimestamp,
        metadata: {},
      });
    };
  }

  /** Handle plugin changes */
  private _onPluginChange(panel: VizPanel, newPluginId: string) {
    this._pluginId = newPluginId;
    const plugin = panel.getPlugin();
    this._pluginVersion = plugin?.meta?.info?.version;

    writeSceneLog(this._getPanelInfo(), `Plugin changed to ${newPluginId}`);
  }

  /** Start tracking this panel */
  private _startTracking() {
    if (!this._panelKey || !this._pluginId || this._isTracking) {
      return;
    }

    this._isTracking = true;
  }

  /** Cleanup when behavior is deactivated */
  private _cleanup() {
    this._activeQueries.clear();
    this._isTracking = false;
    writeSceneLog(this._getPanelInfo(), 'Cleaned up');
  }

  /**
   * Track data transformation with operation ID correlation
   */
  public onDataTransformStart(
    timestamp: number,
    transformationId: string,
    metrics: {
      transformationCount: number;
      // dataFrameCount: number;
      // totalDataPoints: number;
      seriesTransformationCount: number;
      annotationTransformationCount: number;
    }
  ):
    | ((
        endTimestamp: number,
        duration: number,
        success: boolean,
        result?: {
          // outputSeriesCount?: number;
          // outputAnnotationsCount?: number;
          error?: string;
        }
      ) => void)
    | null {
    if (!this._panelKey) {
      return null;
    }

    const operationId = generateOperationId('transform');
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
        // dataFrameCount: metrics.dataFrameCount,
        // totalDataPoints: metrics.totalDataPoints,
        seriesTransformationCount: metrics.seriesTransformationCount,
        annotationTransformationCount: metrics.annotationTransformationCount,
      },
    });

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

      getScenePerformanceTracker().notifyPanelOperationComplete({
        operationId,
        panelId: this._panelId!,
        panelKey: this._panelKey,
        pluginId: this._pluginId!,
        operation: 'transform',
        timestamp: endTimestamp,
        duration,
        metadata: {
          transformationId,
          transformationCount: metrics.transformationCount,
          seriesTransformationCount: metrics.seriesTransformationCount,
          annotationTransformationCount: metrics.annotationTransformationCount,
          success,
          error: result?.error || (!success ? 'Transform operation failed' : undefined),
          // dataFrameCount: metrics.dataFrameCount,
          // totalDataPoints: metrics.totalDataPoints,
          // outputSeriesCount: result?.outputSeriesCount,
          // outputAnnotationsCount: result?.outputAnnotationsCount,
        },
      });
    };
    return callback;
  }
}
