import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneQueryControllerLike } from './types';

const POST_STORM_WINDOW = 2000; // Time after last query to observe slow frames
const SPAN_THRESHOLD = 30; // Frames longer than this will be considered slow (manual tracking)
const TAB_INACTIVE_THRESHOLD = 1000; // Tab inactive threshold in ms

/**
 * SceneRenderProfiler tracks dashboard interaction performance including:
 * - Total interaction duration
 * - Network time
 * - Long animation frames using the Long Animation Frame (LoAF) API when available
 * - Falls back to manual frame tracking using requestAnimationFrame when LoAF is not supported
 *
 * LoAF API provides:
 * - More accurate frame timing (browser-level implementation)
 * - Script attribution (which scripts caused the long frame)
 * - Standard 50ms threshold for long frames
 *
 * Manual fallback provides:
 * - Broader browser support
 * - Configurable threshold (30ms)
 * - Similar metrics but without attribution data
 */

export class SceneRenderProfiler {
  #profileInProgress: {
    // Profile origin, i.e. scene refresh picker
    origin: string;
    crumbs: string[];
  } | null = null;

  #profileStartTs: number | null = null;
  #trailAnimationFrameId: number | null = null;

  // Will keep measured lengths trailing frames
  #recordedTrailingSpans: number[] = [];

  // Long Frame API support
  #supportsLoAF = false;
  #loafObserver: PerformanceObserver | null = null;
  #longFramesCount = 0;
  #longFramesTotalTime = 0;
  #manualFrameTrackingId: number | null = null;
  #lastManualFrameTime = 0;

  #visibilityChangeHandler: (() => void) | null = null;

  public constructor(private queryController?: SceneQueryControllerLike) {
    this.setupVisibilityChangeHandler();
    this.detectLoAFSupport();
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

    // Cleanup LoAF observer
    if (this.#loafObserver) {
      this.#loafObserver.disconnect();
      this.#loafObserver = null;
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
    this.#profileInProgress = { origin: name, crumbs: [] };
    this.#profileStartTs = performance.now();
    this.#longFramesCount = 0;
    this.#longFramesTotalTime = 0;
    this.startLongFrameTracking();
    writeSceneLog(
      'SceneRenderProfiler',
      `Profile started[${force ? 'forced' : 'clean'}]`,
      this.#profileInProgress,
      this.#profileStartTs
    );
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
        'Stoped recording, total measured time (network included):',
        profileDuration + slowFramesTime
      );
      this.#trailAnimationFrameId = null;

      const profileEndTs = profileStartTs + profileDuration + slowFramesTime;

      // Guard against race condition where profile might be cancelled during execution
      if (!this.#profileInProgress) {
        return;
      }

      performance.measure(`DashboardInteraction ${this.#profileInProgress.origin}`, {
        start: profileStartTs,
        end: profileEndTs,
      });

      const networkDuration = captureNetwork(profileStartTs, profileEndTs);

      if (this.queryController?.state.onProfileComplete && this.#profileInProgress) {
        this.queryController.state.onProfileComplete({
          origin: this.#profileInProgress.origin,
          crumbs: this.#profileInProgress.crumbs,
          duration: profileDuration + slowFramesTime,
          networkDuration,
          startTs: profileStartTs,
          endTs: profileEndTs,
          longFramesCount: this.#longFramesCount,
          longFramesTotalTime: this.#longFramesTotalTime,
          // @ts-ignore
          jsHeapSizeLimit: performance.memory ? performance.memory.jsHeapSizeLimit : 0,
          // @ts-ignore
          usedJSHeapSize: performance.memory ? performance.memory.usedJSHeapSize : 0,
          // @ts-ignore
          totalJSHeapSize: performance.memory ? performance.memory.totalJSHeapSize : 0,
        });

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
      this.stopLongFrameTracking();
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
      this.#profileInProgress = null;
      // Cancel any pending animation frame to prevent accessing null profileInProgress
      if (this.#trailAnimationFrameId) {
        cancelAnimationFrame(this.#trailAnimationFrameId);
        this.#trailAnimationFrameId = null;
      }
      // Stop long frame tracking
      this.stopLongFrameTracking();
      // Reset recorded spans to ensure complete cleanup
      this.#recordedTrailingSpans = [];
      this.#longFramesCount = 0;
      this.#longFramesTotalTime = 0;
    }
  }

  public addCrumb(crumb: string) {
    if (this.#profileInProgress) {
      writeSceneLog('SceneRenderProfiler', 'Adding crumb:', crumb);
      this.#profileInProgress.crumbs.push(crumb);
    }
  }

  private detectLoAFSupport() {
    // Check if PerformanceObserver and long-animation-frame type are supported
    if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes &&
      PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')
    ) {
      this.#supportsLoAF = true;
      writeSceneLog('SceneRenderProfiler', 'Long Animation Frame API is supported');
    } else {
      this.#supportsLoAF = false;
      writeSceneLog('SceneRenderProfiler', 'Long Animation Frame API is not supported, using fallback');
    }
  }

  private startLongFrameTracking() {
    if (this.#supportsLoAF) {
      this.startLoAFTracking();
    } else {
      this.startManualFrameTracking();
    }
  }

  private stopLongFrameTracking() {
    if (this.#supportsLoAF) {
      this.stopLoAFTracking();
    } else {
      this.stopManualFrameTracking();
    }
  }

  private startLoAFTracking() {
    try {
      this.#loafObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // LoAF considers frames >50ms as long
          if (entry.duration > 50) {
            this.#longFramesCount++;
            this.#longFramesTotalTime += entry.duration;
            writeSceneLog(
              'SceneRenderProfiler',
              `Long frame detected (LoAF): ${entry.duration}ms at ${entry.startTime}ms, total count: ${
                this.#longFramesCount
              }`
            );

            // Log script attribution if available
            if ('scripts' in entry && Array.isArray((entry as any).scripts)) {
              const scripts = (entry as any).scripts;
              scripts.forEach((script: any) => {
                if (script.duration > 10) {
                  // Only log scripts that took >10ms
                  writeSceneLog(
                    'SceneRenderProfiler',
                    `  Script attribution: ${script.name || 'anonymous'} took ${script.duration}ms`
                  );
                }
              });
            }
          }
        }
      });

      this.#loafObserver.observe({ type: 'long-animation-frame', buffered: true });
      writeSceneLog('SceneRenderProfiler', 'Started LoAF tracking');
    } catch (error) {
      writeSceneLog('SceneRenderProfiler', 'Failed to start LoAF tracking, falling back to manual:', error);
      this.#supportsLoAF = false;
      this.startManualFrameTracking();
    }
  }

  private stopLoAFTracking() {
    if (this.#loafObserver) {
      this.#loafObserver.disconnect();
      this.#loafObserver = null;
      writeSceneLog('SceneRenderProfiler', 'Stopped LoAF tracking');
    }
  }

  private startManualFrameTracking() {
    this.#lastManualFrameTime = performance.now();
    this.#manualFrameTrackingId = requestAnimationFrame(() => this.measureManualFrames());
    writeSceneLog('SceneRenderProfiler', 'Started manual frame tracking (fallback)');
  }

  private stopManualFrameTracking() {
    if (this.#manualFrameTrackingId) {
      cancelAnimationFrame(this.#manualFrameTrackingId);
      this.#manualFrameTrackingId = null;
      writeSceneLog('SceneRenderProfiler', 'Stopped manual frame tracking');
    }
  }

  private measureManualFrames = () => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - this.#lastManualFrameTime;

    // Skip if tab was inactive
    if (frameLength > TAB_INACTIVE_THRESHOLD) {
      writeSceneLog('SceneRenderProfiler', 'Tab was inactive during manual frame tracking, skipping frame');
      this.#lastManualFrameTime = currentFrameTime;
      if (this.#profileInProgress && this.#manualFrameTrackingId) {
        this.#manualFrameTrackingId = requestAnimationFrame(this.measureManualFrames);
      }
      return;
    }

    // Track frames >30ms (more sensitive than LoAF's 50ms)
    if (frameLength > SPAN_THRESHOLD) {
      this.#longFramesCount++;
      this.#longFramesTotalTime += frameLength;
      writeSceneLog(
        'SceneRenderProfiler',
        `Long frame detected (manual): ${frameLength}ms, total count: ${this.#longFramesCount}`
      );
    }

    this.#lastManualFrameTime = currentFrameTime;

    // Continue tracking if profile is still in progress
    if (this.#profileInProgress && this.#manualFrameTrackingId) {
      this.#manualFrameTrackingId = requestAnimationFrame(this.measureManualFrames);
    }
  };
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
