import { LoadingState } from '@grafana/schema';
import { SceneObject, SceneObjectState } from '../core/types';
import { DataQueryRequest } from '@grafana/data';

export interface QueryResultWithState {
  state: LoadingState;
}

export interface SceneQueryControllerEntry {
  request?: DataQueryRequest;
  type: SceneQueryControllerEntryType;
  origin: SceneObject;
  cancel?: () => void;
}

export type SceneQueryControllerEntryType = 'data' | 'annotations' | 'variable' | 'alerts' | 'plugin' | string;

export interface SceneInteractionProfileEvent {
  origin: string;
  duration: number;
  networkDuration: number;
  jsHeapSizeLimit: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  crumbs: string[];
  startTs: number;
  endTs: number;
  /** Dashboard-level interaction correlation context (S4.0) */
  interactionContext?: {
    /** Unique identifier for this interaction across dashboard and panels */
    interactionId: string;
    /** Type of interaction (e.g., 'dashboard_view', 'refresh', 'time_range_change') */
    interactionType: string;
    /** Source of the interaction (e.g., 'scene-render-profiler') */
    interactionSource: string;
    /** High-resolution timestamp when interaction started */
    interactionStartTime: number;
  };
  /** Optional array of panel-level performance metrics (S5.0: Hybrid structure) */
  panelMetrics?: Array<{
    /** Legacy panel ID from the dashboard model */
    panelId: string;
    /** Scene object key for the panel */
    panelKey: string;
    /** Panel plugin type (e.g., 'timeseries', 'table', 'gauge') */
    pluginId: string;
    /** Version of the panel plugin */
    pluginVersion?: string;

    /** Plugin loading metrics */
    pluginLoadTime?: number;
    pluginLoadedFromCache?: boolean;

    /** Query metrics - totals */
    totalQueryTime?: number;
    queryCount?: number;

    /** Field config metrics - totals (separate from transformations) */
    totalFieldConfigTime?: number;
    fieldConfigCount?: number;

    /** Transformation metrics - totals (separate from field config) */
    totalTransformationTime?: number;
    transformationCount?: number;

    /** Render metrics - totals */
    totalRenderTime?: number;
    renderCount?: number;

    /** Data context (latest values) */
    dataPointsCount?: number;
    seriesCount?: number;

    /** Error handling */
    error?: string;
    memoryIncrease?: number;
    longFramesCount?: number;
    longFramesTotalTime?: number;

    /** S5.0: Detailed operation arrays for analysis */
    queryOperations?: Array<{
      duration: number;
      timestamp: number;
      queryType: string;
      queryId: string;
    }>;

    fieldConfigOperations?: Array<{
      duration: number;
      timestamp: number;
      dataPointsCount?: number;
      seriesCount?: number;
    }>;

    transformationOperations?: Array<{
      duration: number;
      timestamp: number;
      transformationId: string; // Transformation types: "organize+calculate" or "customTransformation"
      outputSeriesCount?: number;
      outputAnnotationsCount?: number;
    }>;

    renderOperations?: Array<{
      duration: number;
      timestamp: number;
      type: string;
    }>;

    /** Panel-level interaction correlation context (S4.0) */
    correlationContext?: {
      /** Unique identifier for this interaction across dashboard and panels */
      interactionId: string;
      /** Type of interaction (e.g., 'dashboard_view', 'refresh', 'time_range_change') */
      interactionType: string;
      /** Source of the interaction (e.g., 'scene-render-profiler') */
      interactionSource: string;
      /** High-resolution timestamp when interaction started */
      interactionStartTime: number;
      /** Panel ID for this specific panel */
      panelId: string;
      /** Panel scene object key */
      panelKey: string;
    };
  }>;
  // add more granular data,i.e. network times? slow frames?
}

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
  enableProfiling?: boolean;
  onProfileComplete?(event: SceneInteractionProfileEvent): void;
}

export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;
  cancelAll(): void;

  queryStarted(entry: SceneQueryControllerEntry): void;
  queryCompleted(entry: SceneQueryControllerEntry): void;
  startProfile(name: string): void;
  cancelProfile(): void;
  runningQueriesCount(): number;
}
