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
  /** Optional array of panel-level performance metrics */
  panelMetrics?: Array<{
    /** Legacy panel ID from the dashboard model */
    panelId: string;
    /** Scene object key for the panel */
    panelKey: string;
    /** Panel plugin type (e.g., 'timeseries', 'table', 'gauge') */
    pluginId: string;
    /** Version of the panel plugin */
    pluginVersion?: string;
    /** Time taken to load the panel plugin (ms) */
    pluginLoadTime: number;
    /** Whether the plugin was loaded from cache rather than fetched/imported */
    pluginLoadedFromCache: boolean;
    /** Time spent executing data queries (ms) */
    queryTime: number;
    /** Time spent processing data (field config, transformations) (ms) */
    dataProcessingTime: number;
    /** Time spent rendering the panel to DOM (ms) */
    renderTime: number;
    /** Total time for all panel operations (ms) */
    totalTime: number;
    /** Number of long frames (>50ms) during panel operations */
    longFramesCount: number;
    /** Total time of all long frames for this panel (ms) */
    longFramesTotalTime: number;
    /** Number of times this panel was rendered during the interaction */
    renderCount: number;
    /** Number of data points processed by the panel */
    dataPointsCount?: number;
    /** Number of series/fields in the panel data */
    seriesCount?: number;
    /** Error message if panel failed to load or render */
    error?: string;
    /** Memory increase during panel operations (bytes) */
    memoryIncrease?: number;
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
