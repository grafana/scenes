// Performance tracking exports - EXTERNAL API ONLY (used by Grafana)
export { SceneRenderProfiler } from './SceneRenderProfiler';

// Performance observer pattern - essential external API
export {
  getScenePerformanceTracker,
  type ScenePerformanceObserver,
  type DashboardInteractionStartData,
  type DashboardInteractionMilestoneData,
  type DashboardInteractionCompleteData,
  type PanelPerformanceData,
} from './ScenePerformanceTracker';
