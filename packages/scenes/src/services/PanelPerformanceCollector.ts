/**
 * Unified Panel Performance Collection System
 *
 * Enhanced PanelPerformanceCollector that combines:
 * - S1.1: Original performance tracking functionality
 * - S4.0: Interaction correlation context
 * - S5.0: Hybrid metrics (totals + operation arrays)
 *
 * This replaces both the original PanelPerformanceCollector and #panelMetricsRegistry
 * providing a single source of truth for all panel performance data.
 */

import { CorrelationContext } from '@grafana/runtime';
import { PanelLifecyclePhase } from '../behaviors/VizPanelRenderProfiler';

// Operation detail interfaces
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

// Enhanced tracking data with S4.0/S5.0 features
interface EnhancedPanelTrackingData {
  // S1.1: Basic panel info
  panelId: string;
  panelKey: string;
  pluginId: string;
  pluginVersion?: string;

  // S1.1: Phase timing data (preserved for compatibility)
  phaseStartTimes: Map<string, number>;
  phaseDurations: Map<string, number>;

  // S1.1: Performance metrics
  renderCount: number;
  longFramesCount: number;
  longFramesTotalTime: number;

  // S1.1: Memory tracking
  initialMemory?: number;
  finalMemory?: number;

  // S1.1: Data metrics
  dataPointsCount?: number;
  seriesCount?: number;

  // S1.1: Error tracking
  error?: string;
  pluginLoadedFromCache: boolean;

  // S4.0: Correlation context
  correlationContext?: CorrelationContext | null;

  // S5.0: Hybrid metrics - totals for dashboard analysis
  totalQueryTime: number;
  totalFieldConfigTime: number;
  totalTransformationTime: number;
  totalRenderTime: number;

  // S5.0: Hybrid metrics - operation counts
  queryCount: number;
  fieldConfigCount: number;
  transformationCount: number;

  // S5.0: Hybrid metrics - detailed operation arrays
  queryOperations: QueryOperation[];
  fieldConfigOperations: FieldConfigOperation[];
  transformationOperations: TransformationOperation[];
  renderOperations: RenderOperation[];
}

// Enhanced interface for external consumers
export interface HybridPanelMetrics {
  // Basic panel info
  panelId: string;
  panelKey: string;
  pluginId: string;
  pluginVersion?: string;

  // Plugin loading
  pluginLoadTime: number;
  pluginLoadedFromCache: boolean;

  // S5.0: Summary totals
  totalQueryTime: number;
  totalFieldConfigTime: number;
  totalTransformationTime: number;
  totalRenderTime: number;

  // S5.0: Operation counts
  queryCount: number;
  fieldConfigCount: number;
  transformationCount: number;
  renderCount: number;

  // S5.0: Detailed operation arrays
  queryOperations: QueryOperation[];
  fieldConfigOperations: FieldConfigOperation[];
  transformationOperations: TransformationOperation[];
  renderOperations: RenderOperation[];

  // Data context
  dataPointsCount?: number;
  seriesCount?: number;

  // Performance metrics
  longFramesCount: number;
  longFramesTotalTime: number;

  // Error handling
  error?: string;
  memoryIncrease?: number;

  // S4.0: Correlation context
  correlationContext?: CorrelationContext | null;
}

/**
 * Enhanced Panel Performance Collector with S4.0 correlation and S5.0 hybrid metrics
 * Unifies the original PanelPerformanceCollector with SceneRenderProfiler's #panelMetricsRegistry
 */
export class EnhancedPanelPerformanceCollector {
  private panels: Map<string, EnhancedPanelTrackingData> = new Map();

  /**
   * S1.1: Start tracking a new panel (preserved functionality)
   */
  startPanelTracking(panelKey: string, panelId: string, pluginId: string, pluginVersion?: string): void {
    if (this.panels.has(panelKey)) {
      // Panel already being tracked, increment render count
      const panel = this.panels.get(panelKey)!;
      panel.renderCount++;
      return;
    }

    this.panels.set(panelKey, {
      panelId,
      panelKey,
      pluginId,
      pluginVersion,

      // S1.1: Original tracking data
      phaseStartTimes: new Map(),
      phaseDurations: new Map(),
      renderCount: 1,
      longFramesCount: 0,
      longFramesTotalTime: 0,
      pluginLoadedFromCache: false,

      // S4.0: Correlation context
      correlationContext: null,

      // S5.0: Initialize hybrid metrics
      totalQueryTime: 0,
      totalFieldConfigTime: 0,
      totalTransformationTime: 0,
      totalRenderTime: 0,
      queryCount: 0,
      fieldConfigCount: 0,
      transformationCount: 0,
      queryOperations: [],
      fieldConfigOperations: [],
      transformationOperations: [],
      renderOperations: [],
    });

    // S1.1: Capture initial memory if available
    if (this.isChromePerformance()) {
      const panel = this.panels.get(panelKey)!;
      panel.initialMemory = (performance as any).memory.usedJSHeapSize;
    }
  }

  /**
   * S1.1: Start timing a specific phase for a panel (preserved functionality)
   */
  startPhase(panelKey: string, phase: string): void {
    const panel = this.panels.get(panelKey);
    if (!panel) {
      console.warn(`[EnhancedPanelPerformanceCollector] Panel ${panelKey} not found for phase ${phase}`);
      return;
    }

    panel.phaseStartTimes.set(phase, performance.now());
  }

  /**
   * S1.1: End timing a specific phase for a panel (preserved functionality)
   */
  endPhase(panelKey: string, phase: string): void {
    const panel = this.panels.get(panelKey);
    if (!panel) {
      console.warn(`[EnhancedPanelPerformanceCollector] Panel ${panelKey} not found for phase ${phase}`);
      return;
    }

    const startTime = panel.phaseStartTimes.get(phase);
    if (startTime === undefined) {
      console.warn(`[EnhancedPanelPerformanceCollector] Phase ${phase} was not started for panel ${panelKey}`);
      return;
    }

    const duration = performance.now() - startTime;
    panel.phaseDurations.set(phase, duration);
    panel.phaseStartTimes.delete(phase);
  }

  /**
   * S4.0: Set correlation context for a panel
   */
  setCorrelationContext(panelKey: string, context: CorrelationContext | null): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.correlationContext = context;
    }
  }

  /**
   * S5.0: Register a completed operation (hybrid metrics)
   */
  registerQueryOperation(panelKey: string, operation: QueryOperation): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.queryOperations.push(operation);
      panel.totalQueryTime += operation.duration;
      panel.queryCount++;
    }
  }

  registerFieldConfigOperation(panelKey: string, operation: FieldConfigOperation): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.fieldConfigOperations.push(operation);
      panel.totalFieldConfigTime += operation.duration;
      panel.fieldConfigCount++;

      // Update latest data context
      if (operation.dataPointsCount !== undefined) {
        panel.dataPointsCount = operation.dataPointsCount;
      }
      if (operation.seriesCount !== undefined) {
        panel.seriesCount = operation.seriesCount;
      }
    }
  }

  registerTransformationOperation(panelKey: string, operation: TransformationOperation): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.transformationOperations.push(operation);
      panel.totalTransformationTime += operation.duration;
      panel.transformationCount++;
    }
  }

  registerRenderOperation(panelKey: string, operation: RenderOperation): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.renderOperations.push(operation);
      panel.totalRenderTime += operation.duration;
      panel.renderCount++;
    }
  }

  /**
   * S1.1: Set cache status for plugin loading (preserved functionality)
   */
  setPluginCacheStatus(panelKey: string, fromCache: boolean): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.pluginLoadedFromCache = fromCache;
    }
  }

  /**
   * S1.1: Update long frame metrics (preserved functionality)
   */
  updateLongFrameMetrics(panelKey: string, longFramesCount: number, longFramesTotalTime: number): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.longFramesCount += longFramesCount;
      panel.longFramesTotalTime += longFramesTotalTime;
    }
  }

  /**
   * S1.1: Set data metrics (preserved functionality)
   */
  setDataMetrics(panelKey: string, dataPointsCount: number, seriesCount: number): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.dataPointsCount = dataPointsCount;
      panel.seriesCount = seriesCount;
    }
  }

  /**
   * S1.1: Record an error (preserved functionality)
   */
  recordError(panelKey: string, error: string): void {
    const panel = this.panels.get(panelKey);
    if (panel) {
      panel.error = error;
    }
  }

  /**
   * S5.0: Get hybrid panel metrics for analytics
   */
  getHybridPanelMetrics(panelKey: string): HybridPanelMetrics | undefined {
    const panel = this.panels.get(panelKey);
    if (!panel) {
      return undefined;
    }

    // Capture final memory if available
    if (this.isChromePerformance() && panel.initialMemory !== undefined) {
      panel.finalMemory = (performance as any).memory.usedJSHeapSize;
    }

    const pluginLoadTime = panel.phaseDurations.get(PanelLifecyclePhase.PluginLoad) || 0;

    return {
      panelId: panel.panelId,
      panelKey: panel.panelKey,
      pluginId: panel.pluginId,
      pluginVersion: panel.pluginVersion,

      // Plugin metrics
      pluginLoadTime,
      pluginLoadedFromCache: panel.pluginLoadedFromCache,

      // S5.0: Hybrid totals
      totalQueryTime: panel.totalQueryTime,
      totalFieldConfigTime: panel.totalFieldConfigTime,
      totalTransformationTime: panel.totalTransformationTime,
      totalRenderTime: panel.totalRenderTime,

      // S5.0: Operation counts
      queryCount: panel.queryCount,
      fieldConfigCount: panel.fieldConfigCount,
      transformationCount: panel.transformationCount,
      renderCount: panel.renderCount,

      // S5.0: Detailed operation arrays
      queryOperations: [...panel.queryOperations],
      fieldConfigOperations: [...panel.fieldConfigOperations],
      transformationOperations: [...panel.transformationOperations],
      renderOperations: [...panel.renderOperations],

      // Data context
      dataPointsCount: panel.dataPointsCount,
      seriesCount: panel.seriesCount,

      // Performance metrics
      longFramesCount: panel.longFramesCount,
      longFramesTotalTime: panel.longFramesTotalTime,

      // Error handling
      error: panel.error,
      memoryIncrease:
        panel.initialMemory !== undefined && panel.finalMemory !== undefined
          ? panel.finalMemory - panel.initialMemory
          : undefined,

      // S4.0: Correlation context
      correlationContext: panel.correlationContext,
    };
  }

  /**
   * S5.0: Get hybrid metrics for all panels (for dashboard analytics)
   */
  getAllHybridPanelMetrics(): HybridPanelMetrics[] {
    const metrics: HybridPanelMetrics[] = [];

    for (const panelKey of this.panels.keys()) {
      const metric = this.getHybridPanelMetrics(panelKey);
      if (metric) {
        metrics.push(metric);
      }
    }

    return metrics;
  }

  /**
   * S1.1: Get legacy panel metrics (backward compatibility)
   */
  getPanelMetrics(panelKey: string): any {
    const panel = this.panels.get(panelKey);
    if (!panel) {
      return undefined;
    }

    // Capture final memory if available
    if (this.isChromePerformance() && panel.initialMemory !== undefined) {
      panel.finalMemory = (performance as any).memory.usedJSHeapSize;
    }

    const pluginLoadTime = panel.phaseDurations.get(PanelLifecyclePhase.PluginLoad) || 0;
    const queryTime = panel.phaseDurations.get(PanelLifecyclePhase.DataQuery) || 0;
    const dataProcessingTime = panel.phaseDurations.get(PanelLifecyclePhase.DataProcessing) || 0;
    const renderTime = panel.phaseDurations.get(PanelLifecyclePhase.Render) || 0;

    return {
      panelId: panel.panelId,
      panelKey: panel.panelKey,
      pluginId: panel.pluginId,
      pluginVersion: panel.pluginVersion,
      pluginLoadTime,
      pluginLoadedFromCache: panel.pluginLoadedFromCache,
      queryTime,
      dataProcessingTime,
      renderTime,
      totalTime: pluginLoadTime + queryTime + dataProcessingTime + renderTime,
      longFramesCount: panel.longFramesCount,
      longFramesTotalTime: panel.longFramesTotalTime,
      renderCount: panel.renderCount,
      dataPointsCount: panel.dataPointsCount,
      seriesCount: panel.seriesCount,
      error: panel.error,
      memoryIncrease:
        panel.initialMemory !== undefined && panel.finalMemory !== undefined
          ? panel.finalMemory - panel.initialMemory
          : undefined,

      // S4.0: Include correlation context in legacy format
      correlationContext: panel.correlationContext,
    };
  }

  /**
   * S5.0: Clear all panels (called when dashboard interaction starts)
   */
  clearAllPanels(): void {
    this.panels.clear();
  }

  /**
   * S1.1: Remove specific panel
   */
  removePanelMetrics(panelKey: string): void {
    this.panels.delete(panelKey);
  }

  /**
   * S1.1: Get panel count
   */
  getPanelCount(): number {
    return this.panels.size;
  }

  /**
   * S1.1: Check if panel is tracked
   */
  isPanelTracked(panelKey: string): boolean {
    return this.panels.has(panelKey);
  }

  /**
   * S1.1: Chrome performance API detection
   */
  private isChromePerformance(): boolean {
    return typeof (performance as any).memory !== 'undefined';
  }
}

// Singleton instance for global access
let enhancedCollectorInstance: EnhancedPanelPerformanceCollector | undefined;

/**
 * Get the singleton Enhanced Panel Performance Collector instance
 */
export function getEnhancedPanelPerformanceCollector(): EnhancedPanelPerformanceCollector {
  if (!enhancedCollectorInstance) {
    enhancedCollectorInstance = new EnhancedPanelPerformanceCollector();
  }
  return enhancedCollectorInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetEnhancedPanelPerformanceCollector(): void {
  enhancedCollectorInstance = undefined;
}
