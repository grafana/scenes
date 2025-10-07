import { writePerformanceLog } from '../utils/writePerformanceLog';
import { SceneQueryControllerLike, LongFrameEvent, SceneComponentInteractionEvent } from './types';
import {
  getScenePerformanceTracker,
  generateOperationId,
  DashboardInteractionCompleteData,
} from './ScenePerformanceTracker';
import { PanelProfilingManager, PanelProfilingConfig } from './PanelProfilingManager';
import { SceneObject } from '../core/types';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { LongFrameDetector } from './LongFrameDetector';

const POST_STORM_WINDOW = 2000; // Time after last query to observe slow frames
const DEFAULT_LONG_FRAME_THRESHOLD = 30; // Threshold for tail recording slow frames
const TAB_INACTIVE_THRESHOLD = 1000; // Tab inactive threshold in ms

/**
 * SceneRenderProfiler tracks dashboard interaction performance including:
 * - Total interaction duration
 * - Network time
 * - Long frame detection (50ms threshold) during interaction using LoAF API (default) or manual tracking (fallback)
 * - Slow frame detection (30ms threshold) for tail recording after interaction
 *
 * Long frame detection during interaction:
 * - 50ms threshold aligned with LoAF API default
 * - LoAF API preferred (Chrome 123+) with manual fallback
 * - Provides script attribution when using LoAF API
 *
 * Slow frame detection for tail recording:
 * - 30ms threshold for post-interaction monitoring
 * - Manual frame timing measurement
 * - Captures rendering delays after user interaction completes
 */

export class SceneRenderProfiler {
  #profileInProgress: {
    origin: string; // Profile trigger (e.g., 'time_range_change')
    crumbs: string[];
  } | null = null;

  #interactionInProgress: {
    interaction: string;
    startTs: number;
  } | null = null;

  #profileStartTs: number | null = null;
  #trailAnimationFrameId: number | null = null;

  // Generic metadata for observer notifications
  private metadata: Record<string, unknown> = {};

  // Operation ID for correlating dashboard interaction events
  #currentOperationId?: string;

  // Trailing frame measurements
  #recordedTrailingSpans: number[] = [];

  // Long frame tracking
  #longFrameDetector: LongFrameDetector;
  #longFramesCount = 0;
  #longFramesTotalTime = 0;

  #visibilityChangeHandler: (() => void) | null = null;
  #onInteractionComplete: ((event: SceneComponentInteractionEvent) => void) | null = null;

  // Panel profiling composition
  private _panelProfilingManager?: PanelProfilingManager;

  // Query controller for monitoring query completion
  private queryController?: SceneQueryControllerLike;

  public constructor(panelProfilingConfig?: PanelProfilingConfig) {
    this.#longFrameDetector = new LongFrameDetector();
    this.setupVisibilityChangeHandler();
    this.#interactionInProgress = null;

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

  /** Attach profiler to a specific panel */
  public attachProfilerToPanel(panel: VizPanel): void {
    writePerformanceLog('SRP', 'Attaching profiler to panel', panel.state.key);
    this._panelProfilingManager?.attachProfilerToPanel(panel);
  }

  public setInteractionCompleteHandler(handler?: (event: SceneComponentInteractionEvent) => void) {
    this.#onInteractionComplete = handler ?? null;
  }

  private setupVisibilityChangeHandler() {
    if (this.#visibilityChangeHandler) {
      return;
    }

    // Cancel profiling when tab becomes inactive
    this.#visibilityChangeHandler = () => {
      if (document.hidden && this.#profileInProgress) {
        writePerformanceLog('SRP', 'Tab became inactive, cancelling profile');
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

    // Cleanup long frame tracking
    this.#longFrameDetector.stop();

    // Cancel any ongoing profiling
    this.cancelProfile();

    // Cleanup composed panel profiling manager
    this._panelProfilingManager?.cleanup();
  }

  public startProfile(name: string) {
    // Skip profiling if tab is inactive
    if (document.hidden) {
      writePerformanceLog('SRP', 'Tab is inactive, skipping profile', name);
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

  public startInteraction(interaction: string) {
    // Cancel any existing interaction recording
    if (this.#interactionInProgress) {
      writePerformanceLog('SRP', 'Cancelled interaction:', this.#interactionInProgress);
      this.#interactionInProgress = null;
    }

    this.#interactionInProgress = {
      interaction,
      startTs: performance.now(),
    };

    writePerformanceLog('SRP', 'Started interaction:', interaction);
  }

  public stopInteraction() {
    if (!this.#interactionInProgress) {
      return;
    }

    const endTs = performance.now();
    const interactionDuration = endTs - this.#interactionInProgress.startTs;

    // Capture network requests that occurred during the interaction
    const networkDuration = captureNetwork(this.#interactionInProgress.startTs, endTs);

    writePerformanceLog(
      'SRP',
      `[INTERACTION] Complete: ${interactionDuration.toFixed(1)}ms total | ${networkDuration.toFixed(1)}ms network`
    );

    if (this.#onInteractionComplete && this.#profileInProgress) {
      this.#onInteractionComplete({
        origin: this.#interactionInProgress.interaction,
        duration: interactionDuration,
        networkDuration,
        startTs: this.#interactionInProgress.startTs,
        endTs,
      });
    }

    // Create performance marks for browser dev tools
    performance.mark(`${this.#interactionInProgress.interaction}_start`, {
      startTime: this.#interactionInProgress.startTs,
    });
    performance.mark(`${this.#interactionInProgress.interaction}_end`, {
      startTime: endTs,
    });
    performance.measure(
      `Interaction_${this.#interactionInProgress.interaction}`,
      `${this.#interactionInProgress.interaction}_start`,
      `${this.#interactionInProgress.interaction}_end`
    );

    this.#interactionInProgress = null;
  }

  public getCurrentInteraction(): string | null {
    return this.#interactionInProgress?.interaction ?? null;
  }

  /**
   * Start new performance profile
   * @param name - Profile trigger (e.g., 'time_range_change')
   * @param force - True if canceling existing profile, false if starting clean
   */
  private _startNewProfile(name: string, force = false) {
    const profileType = force ? 'forced' : 'clean';
    writePerformanceLog('SRP', `[PROFILER] ${name} started (${profileType})`);
    this.#profileInProgress = { origin: name, crumbs: [] };
    this.#profileStartTs = performance.now();
    this.#longFramesCount = 0;
    this.#longFramesTotalTime = 0;

    this.#currentOperationId = generateOperationId('dashboard');
    getScenePerformanceTracker().notifyDashboardInteractionStart({
      operationId: this.#currentOperationId,
      interactionType: name,
      timestamp: this.#profileStartTs,
      metadata: this.metadata,
    });

    // Start long frame detection with callback
    this.#longFrameDetector.start((event: LongFrameEvent) => {
      // Only record long frames during active profiling
      if (!this.#profileInProgress || !this.#profileStartTs) {
        return;
      }

      // Only record frames that occur after profile started
      if (event.timestamp < this.#profileStartTs) {
        return;
      }

      this.#longFramesCount++;
      this.#longFramesTotalTime += event.duration;
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
      writePerformanceLog('SRP', 'Tab was inactive, cancelling profile measurement');
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
        'SRP',
        'Profile tail recorded, slow frames duration:',
        slowFramesTime,
        slowFrames,
        this.#profileInProgress
      );

      this.#recordedTrailingSpans = [];

      const profileDuration = measurementStartTs - profileStartTs;

      const slowFrameSummary =
        slowFrames.length > 0
          ? `${slowFramesTime.toFixed(1)}ms slow frames[tail recording] (${slowFrames.length}) ⚠️`
          : `${slowFramesTime.toFixed(1)}ms slow frames[tail recording] (${slowFrames.length})`;

      const longFrameSummary =
        this.#longFramesCount > 0
          ? `${this.#longFramesTotalTime.toFixed(1)}ms long frames[LoAF] (${this.#longFramesCount}) ⚠️`
          : `${this.#longFramesTotalTime.toFixed(1)}ms long frames[LoAF] (${this.#longFramesCount})`;

      writePerformanceLog(
        'SRP',
        `[PROFILER] Complete: ${(profileDuration + slowFramesTime).toFixed(
          1
        )}ms total | ${slowFrameSummary} | ${longFrameSummary}`
      );
      this.#longFrameDetector.stop();

      this.#trailAnimationFrameId = null;

      // Profile completion - interaction context now handled by observer pattern

      const profileEndTs = profileStartTs + profileDuration + slowFramesTime;

      // Guard against race condition where profile might be cancelled during execution
      if (!this.#profileInProgress) {
        return;
      }

      const networkDuration = captureNetwork(profileStartTs, profileEndTs);

      if (this.#profileInProgress) {
        // Notify performance observers of dashboard interaction completion
        const dashboardData: DashboardInteractionCompleteData = {
          operationId: this.#currentOperationId || generateOperationId('dashboard-fallback'),
          interactionType: this.#profileInProgress.origin,
          timestamp: profileEndTs,
          duration: profileDuration + slowFramesTime,
          networkDuration: networkDuration,
          longFramesCount: this.#longFramesCount,
          longFramesTotalTime: this.#longFramesTotalTime,
          metadata: this.metadata,
        };

        const tracker = getScenePerformanceTracker();
        tracker.notifyDashboardInteractionComplete(dashboardData);

        this.#profileInProgress = null;
        this.#trailAnimationFrameId = null;
      }
    }
  };

  public tryCompletingProfile() {
    writePerformanceLog('SRP', 'Trying to complete profile', this.#profileInProgress);
    if (this.queryController?.runningQueriesCount() === 0 && this.#profileInProgress) {
      writePerformanceLog('SRP', 'All queries completed, stopping profile');
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
      writePerformanceLog('SRP', 'Cancelled recording frames, new profile started');
    }
  }

  // cancel profile
  public cancelProfile() {
    if (this.#profileInProgress) {
      writePerformanceLog('SRP', 'Cancelling profile', this.#profileInProgress);

      // Profile cancelled - cleanup handled by observer pattern

      this.#profileInProgress = null;
      // Cancel any pending animation frame to prevent accessing null profileInProgress
      if (this.#trailAnimationFrameId) {
        cancelAnimationFrame(this.#trailAnimationFrameId);
        this.#trailAnimationFrameId = null;
      }
      // Stop long frame tracking
      this.#longFrameDetector.stop();
      writePerformanceLog('SRP', 'Stopped long frame detection - profile cancelled');
      // Reset recorded spans to ensure complete cleanup
      this.#recordedTrailingSpans = [];
      this.#longFramesCount = 0;
      this.#longFramesTotalTime = 0;
    }
  }

  public addCrumb(crumb: string) {
    if (this.#profileInProgress) {
      // writeSceneLog('SRP', 'Adding crumb:', crumb);
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
  // identify last span in spans that's bigger than default threshold
  for (let i = spans.length - 1; i >= 0; i--) {
    if (spans[i] > DEFAULT_LONG_FRAME_THRESHOLD) {
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

// Constants moved to ./interactionConstants.ts to avoid circular dependencies
