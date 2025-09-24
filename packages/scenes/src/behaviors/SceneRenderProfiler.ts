import { writePerformanceLog } from '../utils/writePerformanceLog';
import { SceneQueryControllerLike } from './types';
import { getScenePerformanceTracker, generateOperationId, PerformanceEventData } from './ScenePerformanceTracker';
import { PanelProfilingManager, PanelProfilingConfig } from './PanelProfilingManager';
import { SceneObject } from '../core/types';

const POST_STORM_WINDOW = 2000; // Time after last query to observe slow frames
const SPAN_THRESHOLD = 30; // Frames longer than this will be considered slow
const TAB_INACTIVE_THRESHOLD = 1000; // Tab inactive threshold in ms

export class SceneRenderProfiler {
  #profileInProgress: {
    origin: string; // Profile trigger (e.g., 'time_range_change')
    crumbs: string[];
  } | null = null;

  #profileStartTs: number | null = null;
  #trailAnimationFrameId: number | null = null;

  // Generic metadata for observer notifications
  private metadata: Record<string, unknown> = {};

  // Operation ID for correlating dashboard interaction events
  #currentOperationId?: string;

  // Trailing frame measurements
  #recordedTrailingSpans: number[] = [];

  #visibilityChangeHandler: (() => void) | null = null;

  // Panel profiling composition
  private _panelProfilingManager?: PanelProfilingManager;

  // Query controller for monitoring query completion
  private queryController?: SceneQueryControllerLike;

  public constructor(panelProfilingConfig?: PanelProfilingConfig) {
    this.setupVisibilityChangeHandler();

    // Compose with panel profiling manager if provided
    if (panelProfilingConfig) {
      this._panelProfilingManager = new PanelProfilingManager(panelProfilingConfig);
    }
  }

  /** Set generic metadata for observer notifications */
  public setMetadata(metadata: Record<string, unknown>) {
    this.metadata = { ...metadata };
  }

  public setQueryController(queryController: SceneQueryControllerLike) {
    this.queryController = queryController;
  }

  /** Attach panel profiling to a scene object */
  public attachPanelProfiling(sceneObject: SceneObject) {
    this._panelProfilingManager?.attachToScene(sceneObject);
  }

  private setupVisibilityChangeHandler() {
    if (this.#visibilityChangeHandler) {
      return;
    }

    // Cancel profiling when tab becomes inactive
    this.#visibilityChangeHandler = () => {
      if (document.hidden && this.#profileInProgress) {
        writePerformanceLog('SceneRenderProfiler', 'Tab became inactive, cancelling profile');
        this.cancelProfile();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.#visibilityChangeHandler);
    }
  }

  public cleanup() {
    if (this.#visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.#visibilityChangeHandler);
      this.#visibilityChangeHandler = null;
    }
    this.cancelProfile();

    // Cleanup composed panel profiling manager
    this._panelProfilingManager?.cleanup();
  }

  public startProfile(name: string) {
    // Skip profiling if tab is inactive
    if (document.hidden) {
      writePerformanceLog('SceneRenderProfiler', 'Tab is inactive, skipping profile', name);
      return;
    }

    if (this.#profileInProgress) {
      if (this.#trailAnimationFrameId) {
        this.cancelProfile();
        this._startNewProfile(name, true);
      } else {
        this.addCrumb(name);
      }
    } else {
      this._startNewProfile(name);
    }
  }

  /**
   * Start new performance profile
   * @param name - Profile trigger (e.g., 'time_range_change')
   * @param force - True if canceling existing profile, false if starting clean
   */
  private _startNewProfile(name: string, force = false) {
    this.#profileInProgress = { origin: name, crumbs: [] };
    this.#profileStartTs = performance.now();

    const profileType = force ? 'forced' : 'clean';
    writePerformanceLog('SceneRenderProfiler', `Profile started [${profileType}]`, name);

    this.#currentOperationId = generateOperationId('dashboard');
    getScenePerformanceTracker().notifyDashboardInteractionStart({
      operationId: this.#currentOperationId,
      interactionType: name,
      timestamp: this.#profileStartTs,
      metadata: this.metadata,
    });
  }

  private recordProfileTail(measurementStartTime: number, profileStartTs: number) {
    this.#trailAnimationFrameId = requestAnimationFrame(() =>
      this.measureTrailingFrames(measurementStartTime, measurementStartTime, profileStartTs)
    );
  }

  private measureTrailingFrames = (measurementStartTs: number, lastFrameTime: number, profileStartTs: number) => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - lastFrameTime;

    // Detect tab inactivity as backup to Page Visibility API
    if (frameLength > TAB_INACTIVE_THRESHOLD) {
      writePerformanceLog('SceneRenderProfiler', 'Tab was inactive, cancelling profile measurement');
      this.cancelProfile();
      return;
    }

    this.#recordedTrailingSpans.push(frameLength);

    if (currentFrameTime - measurementStartTs! < POST_STORM_WINDOW) {
      if (this.#profileInProgress) {
        this.#trailAnimationFrameId = requestAnimationFrame(() =>
          this.measureTrailingFrames(measurementStartTs, currentFrameTime, profileStartTs)
        );
      }
    } else {
      const slowFrames = processRecordedSpans(this.#recordedTrailingSpans);
      const slowFramesTime = slowFrames.reduce((acc, val) => acc + val, 0);

      writePerformanceLog(
        'SceneRenderProfiler',
        'Profile tail recorded, slow frames duration:',
        slowFramesTime,
        slowFrames,
        this.#profileInProgress
      );

      this.#recordedTrailingSpans = [];

      const profileDuration = measurementStartTs - profileStartTs;

      writePerformanceLog(
        'SceneRenderProfiler',
        'Profile duration (core interaction):',
        profileDuration,
        'ms, trailing frames duration:',
        slowFramesTime,
        'ms, total measured time:',
        profileDuration + slowFramesTime
      );
      this.#trailAnimationFrameId = null;

      // Profile completion - interaction context now handled by observer pattern

      const profileEndTs = profileStartTs + profileDuration + slowFramesTime;

      // Guard against race condition where profile might be cancelled during execution
      if (!this.#profileInProgress) {
        return;
      }

      // Performance measures now handled by Grafana ScenePerformanceService

      const networkDuration = captureNetwork(profileStartTs, profileEndTs);
      // Panel metrics collection now handled by observer pattern in analytics aggregator

      // Legacy onProfileComplete callback removed - analytics now handled by observer pattern
      if (this.#profileInProgress) {
        // Notify performance observers of dashboard interaction completion
        const dashboardData: PerformanceEventData = {
          operationId: this.#currentOperationId || generateOperationId('dashboard-fallback'),
          interactionType: this.#profileInProgress.origin,
          timestamp: profileEndTs,
          duration: profileDuration + slowFramesTime,
          networkDuration: networkDuration,
          metadata: this.metadata,
        };

        const tracker = getScenePerformanceTracker();
        tracker.notifyDashboardInteractionComplete(dashboardData);

        this.#profileInProgress = null;
        this.#trailAnimationFrameId = null;
      }
      // @ts-ignore
      if (window.__runs) {
        // @ts-ignore
        window.__runs += `${Date.now()}, ${profileDuration + slowFramesTime}\n`;
      } else {
        // @ts-ignore
        window.__runs = `${Date.now()}, ${profileDuration + slowFramesTime}\n`;
      }
    }
  };

  public tryCompletingProfile() {
    writePerformanceLog('SceneRenderProfiler', 'Trying to complete profile', this.#profileInProgress);
    if (this.queryController?.runningQueriesCount() === 0 && this.#profileInProgress) {
      writePerformanceLog('SceneRenderProfiler', 'All queries completed, stopping profile');
      this.recordProfileTail(performance.now(), this.#profileStartTs!);
    }
  }

  public isTailRecording() {
    return Boolean(this.#trailAnimationFrameId);
  }

  public cancelTailRecording() {
    if (this.#trailAnimationFrameId) {
      cancelAnimationFrame(this.#trailAnimationFrameId);
      this.#trailAnimationFrameId = null;
      writePerformanceLog('SceneRenderProfiler', 'Cancelled recording frames, new profile started');
    }
  }

  // cancel profile
  public cancelProfile() {
    if (this.#profileInProgress) {
      writePerformanceLog('SceneRenderProfiler', 'Cancelling profile', this.#profileInProgress);

      // Profile cancelled - cleanup handled by observer pattern

      this.#profileInProgress = null;
      // Cancel any pending animation frame to prevent accessing null profileInProgress
      if (this.#trailAnimationFrameId) {
        cancelAnimationFrame(this.#trailAnimationFrameId);
        this.#trailAnimationFrameId = null;
      }
      // Reset recorded spans to ensure complete cleanup
      this.#recordedTrailingSpans = [];
    }
  }

  public addCrumb(crumb: string) {
    if (this.#profileInProgress) {
      // writeSceneLog('SceneRenderProfiler', 'Adding crumb:', crumb);
      // Notify performance observers of milestone
      getScenePerformanceTracker().notifyDashboardInteractionMilestone({
        operationId: generateOperationId('dashboard-milestone'),
        interactionType: this.#profileInProgress.origin,
        timestamp: performance.now(),
        milestone: crumb,
        metadata: this.metadata,
      });
      this.#profileInProgress.crumbs.push(crumb);
    }
  }
}

export function processRecordedSpans(spans: number[]) {
  // identify last span in spans that's bigger than SPAN_THRESHOLD
  for (let i = spans.length - 1; i >= 0; i--) {
    if (spans[i] > SPAN_THRESHOLD) {
      return spans.slice(0, i + 1);
    }
  }
  return [spans[0]];
}

export function captureNetwork(startTs: number, endTs: number) {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  performance.clearResourceTimings();
  // Only include network entries that both started AND ended within the time window
  const networkEntries = entries.filter(
    (entry) =>
      entry.startTime >= startTs &&
      entry.startTime <= endTs &&
      entry.responseEnd >= startTs &&
      entry.responseEnd <= endTs
  );
  for (const entry of networkEntries) {
    performance.measure('Network entry ' + entry.name, {
      start: entry.startTime,
      end: entry.responseEnd,
    });
  }

  return calculateNetworkTime(networkEntries);
}

// Will calculate total time spent on Network
export function calculateNetworkTime(requests: PerformanceResourceTiming[]): number {
  if (requests.length === 0) {
    return 0;
  }

  // Step 1: Sort the requests by startTs
  requests.sort((a, b) => a.startTime - b.startTime);

  // Step 2: Initialize variables
  let totalNetworkTime = 0;
  let currentStart = requests[0].startTime;
  let currentEnd = requests[0].responseEnd;

  // Step 3: Iterate through the sorted list and merge overlapping intervals
  for (let i = 1; i < requests.length; i++) {
    if (requests[i].startTime <= currentEnd) {
      // Overlapping intervals, merge them
      currentEnd = Math.max(currentEnd, requests[i].responseEnd);
    } else {
      // Non-overlapping interval, add the duration to total time
      totalNetworkTime += currentEnd - currentStart;

      // Update current interval
      currentStart = requests[i].startTime;
      currentEnd = requests[i].responseEnd;
    }
  }

  // Step 4: Add the last interval
  totalNetworkTime += currentEnd - currentStart;

  return totalNetworkTime;
}

export const REFRESH_INTERACTION = 'refresh';
export const TIME_RANGE_CHANGE_INTERACTION = 'time_range_change';
export const FILTER_ADDED_INTERACTION = 'filter_added';
export const FILTER_REMOVED_INTERACTION = 'filter_removed';
export const FILTER_CHANGED_INTERACTION = 'filter_changed';
export const FILTER_RESTORED_INTERACTION = 'filter_restored';
export const VARIABLE_VALUE_CHANGED_INTERACTION = 'variable_value_changed';
export const SCOPES_CHANGED_INTERACTION = 'scopes_changed';
