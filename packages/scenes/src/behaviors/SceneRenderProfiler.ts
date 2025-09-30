import { writeSceneLog, writeSceneLogStyled } from '../utils/writeSceneLog';
import { SceneQueryControllerLike, LongFrameEvent, SceneComponentInteractionEvent } from './types';
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
    // Profile origin, i.e. scene refresh picker
    origin: string;
    crumbs: string[];
  } | null = null;

  #interactionInProgress: {
    interaction: string;
    startTs: number;
  } | null = null;

  #profileStartTs: number | null = null;
  #trailAnimationFrameId: number | null = null;

  // Will keep measured lengths trailing frames
  #recordedTrailingSpans: number[] = [];

  // Long frame tracking
  #longFrameDetector: LongFrameDetector;
  #longFramesCount = 0;
  #longFramesTotalTime = 0;

  #visibilityChangeHandler: (() => void) | null = null;
  #onInteractionComplete: ((event: SceneComponentInteractionEvent) => void) | null = null;

  public constructor(private queryController?: SceneQueryControllerLike) {
    this.#longFrameDetector = new LongFrameDetector();
    this.setupVisibilityChangeHandler();
    this.#interactionInProgress = null;
  }

  public setQueryController(queryController: SceneQueryControllerLike) {
    this.queryController = queryController;
  }

  public setInteractionCompleteHandler(handler?: (event: SceneComponentInteractionEvent) => void) {
    this.#onInteractionComplete = handler ?? null;
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

    // Cleanup long frame tracking
    this.#longFrameDetector.stop();

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

  public startInteraction(interaction: string) {
    // Cancel any existing interaction recording
    if (this.#interactionInProgress) {
      writeSceneLog('profile', 'Cancelled interaction:', this.#interactionInProgress);
      this.#interactionInProgress = null;
    }

    this.#interactionInProgress = {
      interaction,
      startTs: performance.now(),
    };

    writeSceneLog('SceneRenderProfiler', 'Started interaction:', interaction);
  }

  public stopInteraction() {
    if (!this.#interactionInProgress) {
      return;
    }

    const endTs = performance.now();
    const interactionDuration = endTs - this.#interactionInProgress.startTs;

    // Capture network requests that occurred during the interaction
    const networkDuration = captureNetwork(this.#interactionInProgress.startTs, endTs);

    writeSceneLog('SceneRenderProfiler', 'Completed interaction:');
    writeSceneLog('', `  ├─ Total time: ${interactionDuration.toFixed(1)}ms`);
    writeSceneLog('', `  ├─ Network duration: ${networkDuration.toFixed(1)}ms`);
    writeSceneLog('', `  ├─ StartTs: ${this.#interactionInProgress.startTs.toFixed(1)}ms`);
    writeSceneLog('', `  └─ EndTs: ${endTs.toFixed(1)}ms`);

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

    // Add performance mark for debugging in dev tools
    if (typeof performance !== 'undefined' && performance.mark) {
      const markName = `Dashboard Profile Start: ${name}`;
      performance.mark(markName);
    }

    // Log profile start in structured format
    writeSceneLogStyled(
      'SceneRenderProfiler',
      `Profile started[${force ? 'forced' : 'clean'}]`,
      'color: #FFCC00; font-weight: bold;'
    );
    writeSceneLog('', `  ├─ Origin: ${this.#profileInProgress?.origin || 'unknown'}`);
    writeSceneLog('', `  └─ Timestamp: ${this.#profileStartTs.toFixed(1)}ms`);

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

      // Log tail recording in structured format
      writeSceneLog(
        'SceneRenderProfiler',
        `Profile tail recorded - Slow frames: ${slowFramesTime.toFixed(1)}ms (${slowFrames.length} frames)`
      );
      writeSceneLog('', `  ├─ Origin: ${this.#profileInProgress?.origin || 'unknown'}`);
      writeSceneLog('', `  └─ Crumbs:`, this.#profileInProgress?.crumbs || []);

      this.#recordedTrailingSpans = [];

      const profileDuration = measurementStartTs - profileStartTs;

      // Add performance marks for debugging in dev tools
      if (typeof performance !== 'undefined' && performance.mark) {
        const profileName = this.#profileInProgress?.origin || 'unknown';
        const totalTime = profileDuration + slowFramesTime;

        // Mark profile completion
        performance.mark(`Dashboard Profile End: ${profileName}`);

        // Add measure from start to end if possible
        const startMarkName = `Dashboard Profile Start: ${profileName}`;
        try {
          performance.measure(
            `Dashboard Profile: ${profileName} (${totalTime.toFixed(1)}ms)`,
            startMarkName,
            `Dashboard Profile End: ${profileName}`
          );
        } catch {
          // Start mark might not exist, create a simple end mark
          performance.mark(`Dashboard Profile Complete: ${profileName} (${totalTime.toFixed(1)}ms)`);
        }

        // Add measurements for slow frame details if significant
        if (slowFrames.length > 0) {
          const slowFramesMarkName = `Slow Frames Summary: ${slowFrames.length} frames (${slowFramesTime.toFixed(
            1
          )}ms)`;
          performance.mark(slowFramesMarkName);

          // Create individual measurements for each slow frame during tail
          slowFrames.forEach((frameTime, index) => {
            if (frameTime > 16) {
              // Only measure frames slower than 16ms (60fps)
              try {
                const frameStartTime =
                  this.#profileStartTs! +
                  profileDuration +
                  (index > 0 ? slowFrames.slice(0, index).reduce((sum, t) => sum + t, 0) : 0);
                const frameId = `slow-frame-${index}`;
                const frameStartMark = `${frameId}-start`;
                const frameEndMark = `${frameId}-end`;

                performance.mark(frameStartMark, { startTime: frameStartTime });
                performance.mark(frameEndMark, { startTime: frameStartTime + frameTime });
                performance.measure(`Slow Frame ${index + 1}: ${frameTime.toFixed(1)}ms`, frameStartMark, frameEndMark);
              } catch {
                // Fallback if startTime not supported
                performance.mark(`Slow Frame ${index + 1}: ${frameTime.toFixed(1)}ms`);
              }
            }
          });
        }
      }

      // Log performance summary in a structured format
      const completionTimestamp = performance.now();
      writeSceneLog('SceneRenderProfiler', 'Profile completed');
      writeSceneLog('', `  ├─ Timestamp: ${completionTimestamp.toFixed(1)}ms`);
      writeSceneLog('', `  ├─ Total time: ${(profileDuration + slowFramesTime).toFixed(1)}ms`);
      writeSceneLog('', `  ├─ Slow frames: ${slowFramesTime}ms (${slowFrames.length} frames)`);
      writeSceneLog('', `  └─ Long frames: ${this.#longFramesTotalTime}ms (${this.#longFramesCount} frames)`);

      // Stop long frame detection now that the profile is complete
      this.#longFrameDetector.stop();
      writeSceneLogStyled(
        'SceneRenderProfiler',
        `Stopped long frame detection - profile complete at ${completionTimestamp.toFixed(1)}ms`,
        'color: #00CC00; font-weight: bold;'
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
    if (!this.#profileInProgress) {
      return;
    }

    writeSceneLog('SceneRenderProfiler', 'Trying to complete profile', this.#profileInProgress);
    if (this.queryController?.runningQueriesCount() === 0 && this.#profileInProgress) {
      writeSceneLog('SceneRenderProfiler', 'All queries completed, starting tail measurement');
      // Note: Long frame detector continues running during tail measurement
      // It will be stopped when the profile completely finishes
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
      this.#longFrameDetector.stop();
      writeSceneLog('SceneRenderProfiler', 'Stopped long frame detection - profile cancelled');
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

export const REFRESH_INTERACTION = 'refresh';
export const TIME_RANGE_CHANGE_INTERACTION = 'time_range_change';
export const FILTER_ADDED_INTERACTION = 'filter_added';
export const FILTER_REMOVED_INTERACTION = 'filter_removed';
export const FILTER_CHANGED_INTERACTION = 'filter_changed';
export const FILTER_RESTORED_INTERACTION = 'filter_restored';
export const VARIABLE_VALUE_CHANGED_INTERACTION = 'variable_value_changed';
export const SCOPES_CHANGED_INTERACTION = 'scopes_changed';
export const ADHOC_KEYS_DROPDOWN_INTERACTION = 'adhoc_keys_dropdown';
export const ADHOC_VALUES_DROPDOWN_INTERACTION = 'adhoc_values_dropdown';
export const GROUPBY_DIMENSIONS_INTERACTION = 'groupby_dimensions';
