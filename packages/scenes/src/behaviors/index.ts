export { ActWhenVariableChanged } from './ActWhenVariableChanged';
export { CursorSync } from './CursorSync';
export { SceneQueryController } from './SceneQueryController';
export { LiveNowTimer } from './LiveNowTimer';
export { VizPanelRenderProfiler } from './VizPanelRenderProfiler';

// Performance tracking observer pattern
export {
  ScenePerformanceTracker,
  getScenePerformanceTracker,
  type ScenePerformanceObserver,
  type DashboardPerformanceData,
  type PanelPerformanceData,
  type QueryPerformanceData,
} from './ScenePerformanceTracker';
