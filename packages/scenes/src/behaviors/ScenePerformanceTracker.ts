/**
 * Centralized performance tracking system for Scenes
 * Provides a clean observer pattern interface for external systems (like Grafana) to monitor performance
 */

// Helper function to generate unique operation IDs
let operationCounter = 0;
export function generateOperationId(prefix = 'op'): string {
  return `${prefix}-${Date.now()}-${++operationCounter}`;
}

export interface DashboardPerformanceData {
  operationId: string; // Unique identifier for correlating start/complete events
  interactionType: string;
  dashboardUID: string;
  dashboardTitle: string;
  panelCount: number;
  timestamp: number;
  duration?: number;
  networkDuration?: number;
  milestone?: string;
  metadata?: Record<string, any>;
}

export interface PanelPerformanceData {
  operationId: string; // Unique identifier for correlating start/complete events
  panelId: string;
  panelKey: string;
  pluginId: string;
  pluginVersion?: string;
  panelTitle?: string;
  operation: 'lifecycle' | 'query' | 'transform' | 'fieldConfig' | 'render';
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface QueryPerformanceData {
  operationId: string; // Unique identifier for correlating start/complete events
  panelId: string;
  queryId: string;
  queryType?: string;
  datasource?: string;
  timestamp: number;
  duration?: number;
  seriesCount?: number;
  dataPointsCount?: number;
  error?: string;
}

/**
 * Observer interface for performance monitoring
 * External systems implement this to receive performance notifications
 */
export interface ScenePerformanceObserver {
  // Dashboard-level events
  onDashboardInteractionStart?(data: DashboardPerformanceData): void;
  onDashboardInteractionMilestone?(data: DashboardPerformanceData): void;
  onDashboardInteractionComplete?(data: DashboardPerformanceData): void;

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

  // Dashboard performance notifications
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

  // Dashboard performance notifications
  public notifyDashboardInteractionStart(data: DashboardPerformanceData): void {
    this.notifyObservers('onDashboardInteractionStart', data, 'dashboard interaction start');
  }

  public notifyDashboardInteractionMilestone(data: DashboardPerformanceData): void {
    this.notifyObservers('onDashboardInteractionMilestone', data, 'dashboard interaction milestone');
  }

  public notifyDashboardInteractionComplete(data: DashboardPerformanceData): void {
    this.notifyObservers('onDashboardInteractionComplete', data, 'dashboard interaction complete');
  }

  // Panel performance notifications
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

  // Query performance notifications
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
