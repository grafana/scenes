export { ActWhenVariableChanged } from './ActWhenVariableChanged';
export { CursorSync } from './CursorSync';
export { SceneQueryController } from './SceneQueryController';
export { SceneInteractionTracker } from './SceneInteractionTracker';
export { LiveNowTimer } from './LiveNowTimer';
export { VizPanelRenderProfiler } from './VizPanelRenderProfiler';

// Performance tracking observer pattern
export {
  ScenePerformanceTracker,
  getScenePerformanceTracker,
  type ScenePerformanceObserver,
  type BasePerformanceEvent,
  type PerformanceEventData,
  type PanelPerformanceData,
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
