/**
 * Centralized performance tracking system using observer pattern.
 * External systems (like Grafana) implement ScenePerformanceObserver to receive performance events.
 */

/** Generate unique operation IDs for correlating start/complete events */
let operationCounter = 0;
export function generateOperationId(prefix = 'op'): string {
  return `${prefix}-${Date.now()}-${++operationCounter}`;
}

/** Base interface for all performance events */
export interface BasePerformanceEvent {
  operationId: string; // Unique identifier for correlating start/complete events
  timestamp: number;
  duration?: number;
  error?: string;
}

export interface DashboardInteractionStartData extends BasePerformanceEvent {
  interactionType: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardInteractionMilestoneData extends BasePerformanceEvent {
  interactionType: string;
  milestone: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardInteractionCompleteData extends BasePerformanceEvent {
  interactionType: string;
  networkDuration?: number;
  longFramesCount: number;
  longFramesTotalTime: number;
  metadata?: Record<string, unknown>;
}

/** Metadata interface for transform operations */
export interface TransformMetadata {
  transformationId: string;
  transformationCount: number;
  seriesTransformationCount: number;
  annotationTransformationCount: number;
  success?: boolean;
  error?: string;
  // dataFrameCount: number;
  // totalDataPoints: number;
  // outputSeriesCount?: number;
  // outputAnnotationsCount?: number;
}

/** Metadata interface for query operations */
export interface QueryMetadata {
  queryId: string;
  queryType: string;
}

/** Metadata interface for render operations */
export interface RenderMetadata {
  // Empty for now - can be extended later if needed
}

/** Metadata interface for plugin load operations */
export interface PluginLoadMetadata {
  pluginId: string;
  fromCache?: boolean;
  pluginLoadTime?: number;
}

/** Metadata interface for field config operations */
export interface FieldConfigMetadata {
  // dataPointsCount?: number;
  // seriesCount?: number;
  // fieldCount?: number;
  // overrideCount?: number;
  // mappingCount?: number;
}

/** Base interface for panel performance events */
interface BasePanelPerformanceData extends BasePerformanceEvent {
  panelId: string;
  panelKey: string;
  pluginId: string;
  pluginVersion?: string;
  panelTitle?: string;
}

/** Transform operation performance data */
export interface PanelTransformPerformanceData extends BasePanelPerformanceData {
  operation: 'transform';
  metadata: TransformMetadata;
}

/** Query operation performance data */
export interface PanelQueryPerformanceData extends BasePanelPerformanceData {
  operation: 'query';
  metadata: QueryMetadata;
}

/** Render operation performance data */
export interface PanelRenderPerformanceData extends BasePanelPerformanceData {
  operation: 'render';
  metadata: RenderMetadata;
}

/** Plugin load operation performance data */
export interface PanelPluginLoadPerformanceData extends BasePanelPerformanceData {
  operation: 'plugin-load';
  metadata: PluginLoadMetadata;
}

/** Field config operation performance data */
export interface PanelFieldConfigPerformanceData extends BasePanelPerformanceData {
  operation: 'fieldConfig';
  metadata: FieldConfigMetadata;
}

/** Discriminated union of all panel performance data types */
export type PanelPerformanceData =
  | PanelTransformPerformanceData
  | PanelQueryPerformanceData
  | PanelRenderPerformanceData
  | PanelPluginLoadPerformanceData
  | PanelFieldConfigPerformanceData;

/** Non-panel query performance data for dashboard queries (annotations, variables, etc.) */
export interface QueryPerformanceData extends BasePerformanceEvent {
  queryId: string;
  queryType: string;
  querySource: 'annotation' | 'variable' | 'plugin' | 'datasource' | 'unknown';
  origin: string; // e.g., "AnnotationsDataLayer", "QueryVariable", "VizPanel/loadPlugin"
}

/**
 * Observer interface for performance monitoring
 * External systems implement this to receive performance notifications
 */
export interface ScenePerformanceObserver {
  // Dashboard-level events
  onDashboardInteractionStart?(data: DashboardInteractionStartData): void;
  onDashboardInteractionMilestone?(data: DashboardInteractionMilestoneData): void;
  onDashboardInteractionComplete?(data: DashboardInteractionCompleteData): void;

  // Panel-level events
  onPanelOperationStart?(data: PanelPerformanceData): void;
  onPanelOperationComplete?(data: PanelPerformanceData): void;

  // Query-level events
  onQueryStart?(data: QueryPerformanceData): void;
  onQueryComplete?(data: QueryPerformanceData): void;
}

/**
 * Centralized performance tracker
 * Manages observers and provides methods for scene objects to report performance events
 */
export class ScenePerformanceTracker {
  private static instance: ScenePerformanceTracker | null = null;
  private observers: ScenePerformanceObserver[] = [];

  public static getInstance(): ScenePerformanceTracker {
    if (!ScenePerformanceTracker.instance) {
      ScenePerformanceTracker.instance = new ScenePerformanceTracker();
    }
    return ScenePerformanceTracker.instance;
  }

  /**
   * Register a performance observer
   */
  public addObserver(observer: ScenePerformanceObserver): () => void {
    this.observers.push(observer);

    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Remove all observers (for testing)
   */
  public clearObservers(): void {
    this.observers = [];
  }

  /**
   * Get current observer count (for debugging)
   */
  public getObserverCount(): number {
    return this.observers.length;
  }

  private notifyObservers<T>(methodName: keyof ScenePerformanceObserver, data: T, errorContext: string): void {
    this.observers.forEach((observer) => {
      try {
        const method = observer[methodName] as ((data: T) => void) | undefined;
        method?.(data);
      } catch (error) {
        console.warn(`Error in ${errorContext} observer:`, error);
      }
    });
  }

  public notifyDashboardInteractionStart(data: DashboardInteractionStartData): void {
    this.notifyObservers('onDashboardInteractionStart', data, 'dashboard interaction start');
  }

  public notifyDashboardInteractionMilestone(data: DashboardInteractionMilestoneData): void {
    this.notifyObservers('onDashboardInteractionMilestone', data, 'dashboard interaction milestone');
  }

  public notifyDashboardInteractionComplete(data: DashboardInteractionCompleteData): void {
    this.notifyObservers('onDashboardInteractionComplete', data, 'dashboard interaction complete');
  }

  public notifyPanelOperationStart(data: PanelPerformanceData): void {
    this.notifyObservers('onPanelOperationStart', data, 'panel operation start');
  }

  public notifyPanelOperationComplete(data: PanelPerformanceData): void {
    this.notifyObservers('onPanelOperationComplete', data, 'panel operation complete');
  }

  public notifyQueryStart(data: QueryPerformanceData): void {
    this.notifyObservers('onQueryStart', data, 'query start');
  }

  public notifyQueryComplete(data: QueryPerformanceData): void {
    this.notifyObservers('onQueryComplete', data, 'query complete');
  }
}

/**
 * Get the global performance tracker instance
 */
export function getScenePerformanceTracker(): ScenePerformanceTracker {
  return ScenePerformanceTracker.getInstance();
}
