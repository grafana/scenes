import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneQueryControllerLike } from './types';
import { getScenePerformanceTracker, generateOperationId, DashboardPerformanceData } from './ScenePerformanceTracker';

// Legacy import removed - unified collector handles all metrics

const POST_STORM_WINDOW = 2000; // Time after last query to observe slow frames
const SPAN_THRESHOLD = 30; // Frames longer than this will be considered slow
const TAB_INACTIVE_THRESHOLD = 1000; // Tab inactive threshold in ms

export class SceneRenderProfiler {
  #profileInProgress: {
    // Profile origin, i.e. scene refresh picker
    origin: string;
    crumbs: string[];
  } | null = null;

  #profileStartTs: number | null = null;
  #trailAnimationFrameId: number | null = null;

  // Dashboard metadata for observer notifications
  private dashboardUID?: string;
  private dashboardTitle?: string;
  private panelCount?: number;

  // Operation ID for correlating dashboard interaction events
  #currentOperationId?: string;

  // Legacy S5.0: Registry replaced by unified collector

  // Will keep measured lengths trailing frames
  #recordedTrailingSpans: number[] = [];

  #visibilityChangeHandler: (() => void) | null = null;

  public constructor(private queryController?: SceneQueryControllerLike) {
    this.setupVisibilityChangeHandler();
  }

  // Method to set dashboard metadata from Grafana
  public setDashboardMetadata(uid: string, title: string, panelCount: number) {
    this.dashboardUID = uid;
    this.dashboardTitle = title;
    this.panelCount = panelCount;
  }

  public setQueryController(queryController: SceneQueryControllerLike) {
    this.queryController = queryController;
  }

  private setupVisibilityChangeHandler() {
    // Ensure event listener is only added once
    if (this.#visibilityChangeHandler) {
      return;
    }

    // Handle tab switching with Page Visibility API
    this.#visibilityChangeHandler = () => {
      if (document.hidden && this.#profileInProgress) {
        writeSceneLog('SceneRenderProfiler', 'Tab became inactive, cancelling profile');
        this.cancelProfile();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.#visibilityChangeHandler);
    }
  }

  public cleanup() {
    // Remove event listener to prevent memory leaks
    if (this.#visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.#visibilityChangeHandler);
      this.#visibilityChangeHandler = null;
    }

    // Cancel any ongoing profiling
    this.cancelProfile();
  }

  public startProfile(name: string) {
    // Only start profile if tab is active. This makes sure we don't start a profile when i.e. someone opens a dashboard in a new tab
    // and doesn't interact with it.
    if (document.hidden) {
      writeSceneLog('SceneRenderProfiler', 'Tab is inactive, skipping profile', name);
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
   * Starts a new profile for performance measurement.
   *
   * @param name - The origin/trigger of the profile (e.g., 'time_range_change', 'variable_value_changed')
   * @param force - Whether this is a "forced" profile (true) or "clean" profile (false)
   *               - "forced": Started by canceling an existing profile that was recording trailing frames
   *                           This happens when a new user interaction occurs before the previous one
   *                           finished measuring its performance impact
   *               - "clean": Started when no profile is currently active
   */
  private _startNewProfile(name: string, force = false) {
    // S5.0: Clear panel metrics registry for new profile
    this.clearPanelMetricsRegistry();

    this.#profileInProgress = { origin: name, crumbs: [] };
    this.#profileStartTs = performance.now();

    // Profile type tracking for logging purposes
    const profileType = force ? 'forced' : 'clean';
    writeSceneLog('SceneRenderProfiler', `Profile started [${profileType}]`, name);

    // Generate operation ID and notify performance observers of dashboard interaction start
    this.#currentOperationId = generateOperationId('dashboard');
    getScenePerformanceTracker().notifyDashboardInteractionStart({
      operationId: this.#currentOperationId,
      interactionType: name,
      dashboardUID: this.getDashboardUID(),
      dashboardTitle: this.getDashboardTitle(),
      panelCount: this.getPanelCount(),
      timestamp: this.#profileStartTs,
    });

    // writeSceneLog(
    //   'SceneRenderProfiler',
    //   `Profile started[${force ? 'forced' : 'clean'}]`,
    //   this.#profileInProgress,
    //   this.#profileStartTs
    // );
  }

  private recordProfileTail(measurementStartTime: number, profileStartTs: number) {
    this.#trailAnimationFrameId = requestAnimationFrame(() =>
      this.measureTrailingFrames(measurementStartTime, measurementStartTime, profileStartTs)
    );
  }

  private measureTrailingFrames = (measurementStartTs: number, lastFrameTime: number, profileStartTs: number) => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - lastFrameTime;

    // Fallback: Detect if tab was inactive (frame longer than reasonable threshold)
    // This serves as backup to Page Visibility API in case the event wasn't triggered
    if (frameLength > TAB_INACTIVE_THRESHOLD) {
      writeSceneLog('SceneRenderProfiler', 'Tab was inactive, cancelling profile measurement');
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

      writeSceneLog(
        this.constructor.name,
        'Profile tail recorded, slow frames duration:',
        slowFramesTime,
        slowFrames,
        this.#profileInProgress
      );

      this.#recordedTrailingSpans = [];

      const profileDuration = measurementStartTs - profileStartTs;

      writeSceneLog(
        this.constructor.name,
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
        const dashboardData: DashboardPerformanceData = {
          operationId: this.#currentOperationId || generateOperationId('dashboard-fallback'),
          interactionType: this.#profileInProgress.origin,
          dashboardUID: this.getDashboardUID(),
          dashboardTitle: this.getDashboardTitle(),
          panelCount: this.getPanelCount(),
          timestamp: profileEndTs,
          duration: profileDuration + slowFramesTime,
          networkDuration: networkDuration,
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
    writeSceneLog('SceneRenderProfiler', 'Trying to complete profile', this.#profileInProgress);
    if (this.queryController?.runningQueriesCount() === 0 && this.#profileInProgress) {
      writeSceneLog('SceneRenderProfiler', 'All queries completed, stopping profile');
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
      writeSceneLog('SceneRenderProfiler', 'Cancelled recording frames, new profile started');
    }
  }

  // cancel profile
  public cancelProfile() {
    if (this.#profileInProgress) {
      writeSceneLog('SceneRenderProfiler', 'Cancelling profile', this.#profileInProgress);

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

  /**
   * S5.0: Register panel metrics (hybrid approach - totals + details)
   * Panels call this method to update their metrics as operations complete
   * Accumulates totals and maintains detailed operation history
   */
  public registerPanelMetrics(panelKey: string, partialMetrics: any): void {
    // Legacy method - now handled by unified collector
    writeSceneLog(
      'SceneRenderProfiler',
      `Legacy registerPanelMetrics called for panel ${panelKey} - now handled by unified collector`
    );
  }

  // Legacy mergeHybridMetrics method removed - now handled by unified collector

  // Panel metrics collection removed - now handled by observer pattern in analytics aggregator

  /**
   * Clear panel metrics - now handled by analytics aggregator
   */
  private clearPanelMetricsRegistry(): void {
    // Clearing is now handled by the analytics aggregator via observer events
    // No direct collector interaction needed
  }

  public addCrumb(crumb: string) {
    if (this.#profileInProgress) {
      // writeSceneLog('SceneRenderProfiler', 'Adding crumb:', crumb);
      // Notify performance observers of milestone
      getScenePerformanceTracker().notifyDashboardInteractionMilestone({
        operationId: generateOperationId('dashboard-milestone'),
        interactionType: this.#profileInProgress.origin,
        dashboardUID: this.getDashboardUID(),
        dashboardTitle: this.getDashboardTitle(),
        panelCount: this.getPanelCount(),
        timestamp: performance.now(),
        milestone: crumb,
      });
      this.#profileInProgress.crumbs.push(crumb);
    }
  }

  // Helper methods for observer notifications
  private getDashboardUID(): string {
    return this.dashboardUID ?? 'unknown';
  }

  private getDashboardTitle(): string {
    return this.dashboardTitle ?? 'Unknown Dashboard';
  }

  private getPanelCount(): number {
    return this.panelCount ?? 0;
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
