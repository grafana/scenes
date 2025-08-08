import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneQueryControllerLike } from './types';

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

  // Will keep measured lengths trailing frames
  #recordedTrailingSpans: number[] = [];

  lastFrameTime = 0;
  #visibilityChangeHandler: (() => void) | null = null;

  public constructor(private queryController?: SceneQueryControllerLike) {
    this.setupVisibilityChangeHandler();
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
    // and dooesn't interact with it.
    if (document.hidden) {
      writeSceneLog('SceneRenderProfiler', 'Tab is inactive, skipping profile', name);
      return;
    }
    if (this.#profileInProgress) {
      this.addCrumb(name);
    } else {
      this.#profileInProgress = { origin: name, crumbs: [] };
      this.#profileStartTs = performance.now();
      writeSceneLog('SceneRenderProfiler', 'Profile started:', this.#profileInProgress, this.#profileStartTs);
    }
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
      // Reset recorded spans to ensure complete cleanup
      this.#recordedTrailingSpans = [];
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
