// Performance tracking exports
export { SceneRenderProfiler } from './SceneRenderProfiler';
export { VizPanelRenderProfiler } from './VizPanelRenderProfiler';
export { PanelProfilingManager, type PanelProfilingConfig } from './PanelProfilingManager';
export { LongFrameDetector } from './LongFrameDetector';

// Performance tracking observer pattern
export {
  ScenePerformanceTracker,
  getScenePerformanceTracker,
  generateOperationId,
  type ScenePerformanceObserver,
  type BasePerformanceEvent,
  type DashboardInteractionStartData,
  type DashboardInteractionMilestoneData,
  type DashboardInteractionCompleteData,
  type PanelPerformanceData,
  type PanelTransformPerformanceData,
  type PanelQueryPerformanceData,
  type PanelRenderPerformanceData,
  type PanelPluginLoadPerformanceData,
  type PanelFieldConfigPerformanceData,
  type TransformMetadata,
  type QueryMetadata,
  type RenderMetadata,
  type PluginLoadMetadata,
  type FieldConfigMetadata,
  type QueryPerformanceData,
} from './ScenePerformanceTracker';

// Interaction constants for performance tracking
export {
  REFRESH_INTERACTION,
  TIME_RANGE_CHANGE_INTERACTION,
  FILTER_ADDED_INTERACTION,
  FILTER_REMOVED_INTERACTION,
  FILTER_CHANGED_INTERACTION,
  FILTER_RESTORED_INTERACTION,
  VARIABLE_VALUE_CHANGED_INTERACTION,
  SCOPES_CHANGED_INTERACTION,
  ADHOC_KEYS_DROPDOWN_INTERACTION,
  ADHOC_VALUES_DROPDOWN_INTERACTION,
  GROUPBY_DIMENSIONS_INTERACTION,
} from './interactionConstants';
