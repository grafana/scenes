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
  metadata?: Record<string, unknown>; // Additional contextual metadata
  error?: string;
}

export interface PerformanceEventData extends BasePerformanceEvent {
  interactionType: string;
  networkDuration?: number;
  milestone?: string;
  longFramesCount: number;
  longFramesTotalTime: number;
}

export interface PanelPerformanceData extends BasePerformanceEvent {
  panelId: string;
  panelKey: string;
  pluginId: string;
  pluginVersion?: string;
  panelTitle?: string;
  operation: 'lifecycle' | 'query' | 'transform' | 'fieldConfig' | 'render';
}

export interface QueryPerformanceData extends BasePerformanceEvent {
  panelId: string;
  queryId: string;
  queryType?: string;
  datasource?: string;
  seriesCount?: number;
  dataPointsCount?: number;
}

/**
 * Observer interface for performance monitoring
 * External systems implement this to receive performance notifications
 */
export interface ScenePerformanceObserver {
  // Dashboard-level events
  onDashboardInteractionStart?(data: PerformanceEventData): void;
  onDashboardInteractionMilestone?(data: PerformanceEventData): void;
  onDashboardInteractionComplete?(data: PerformanceEventData): void;

  // Panel-level events
  onPanelLifecycleStart?(data: PanelPerformanceData): void;
  onPanelOperationStart?(data: PanelPerformanceData): void;
  onPanelOperationComplete?(data: PanelPerformanceData): void;
  onPanelLifecycleComplete?(data: PanelPerformanceData): void;

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

  public notifyDashboardInteractionStart(data: PerformanceEventData): void {
    this.notifyObservers('onDashboardInteractionStart', data, 'dashboard interaction start');
  }

  public notifyDashboardInteractionMilestone(data: PerformanceEventData): void {
    this.notifyObservers('onDashboardInteractionMilestone', data, 'dashboard interaction milestone');
  }

  public notifyDashboardInteractionComplete(data: PerformanceEventData): void {
    this.notifyObservers('onDashboardInteractionComplete', data, 'dashboard interaction complete');
  }

  public notifyPanelLifecycleStart(data: PanelPerformanceData): void {
    this.notifyObservers('onPanelLifecycleStart', data, 'panel lifecycle start');
  }

  public notifyPanelOperationStart(data: PanelPerformanceData): void {
    this.notifyObservers('onPanelOperationStart', data, 'panel operation start');
  }

  public notifyPanelOperationComplete(data: PanelPerformanceData): void {
    this.notifyObservers('onPanelOperationComplete', data, 'panel operation complete');
  }

  public notifyPanelLifecycleComplete(data: PanelPerformanceData): void {
    this.notifyObservers('onPanelLifecycleComplete', data, 'panel lifecycle complete');
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
