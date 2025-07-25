import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneQueryControllerLike } from './types';

const POST_STORM_WINDOW = 2000; // Time after last query to observe slow frames
const SPAN_THRESHOLD = 30; // Frames longer than this will be considered slow

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

  public constructor(private queryController: SceneQueryControllerLike) {}

  public startProfile(name: string) {
    if (this.#profileInProgress) {
      // When profile is in tail recording phase, we need to stop it and start a new profile
      // TODO: consider capturing the profile that was in progress and marking it as canceled or sth like that.
      if (this.#trailAnimationFrameId) {
        cancelAnimationFrame(this.#trailAnimationFrameId);
        this.#trailAnimationFrameId = null;

        writeSceneLog(this.constructor.name, 'New profile: Stopped recording frames ');

        this.#profileInProgress = { origin: name, crumbs: [] };
        this.#profileStartTs = performance.now();
        writeSceneLog(this.constructor.name, 'Profile started:', this.#profileInProgress, this.#profileStartTs);
      } else {
        // If there i a profile in progress but tail recording is not started, add a crumb to the current profile
        // and consider this a continuation of an interaction.
        this.addCrumb(name);
      }
    } else {
      this.#profileInProgress = { origin: name, crumbs: [] };
      this.#profileStartTs = performance.now();
      writeSceneLog(this.constructor.name, 'Profile started:', this.#profileInProgress, this.#profileStartTs);
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
    this.#recordedTrailingSpans.push(frameLength);

    if (currentFrameTime - measurementStartTs! < POST_STORM_WINDOW) {
      this.#trailAnimationFrameId = requestAnimationFrame(() =>
        this.measureTrailingFrames(measurementStartTs, currentFrameTime, profileStartTs)
      );
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

      performance.measure(`DashboardInteraction ${this.#profileInProgress!.origin}`, {
        start: profileStartTs,
        end: profileEndTs,
      });

      const networkDuration = captureNetwork(profileStartTs, profileEndTs);

      if (this.queryController.state.onProfileComplete) {
        this.queryController.state.onProfileComplete({
          origin: this.#profileInProgress!.origin,
          crumbs: this.#profileInProgress!.crumbs,
          duration: profileDuration + slowFramesTime,
          networkDuration,
          // @ts-ignore
          jsHeapSizeLimit: performance.memory ? performance.memory.jsHeapSizeLimit : 0,
          // @ts-ignore
          usedJSHeapSize: performance.memory ? performance.memory.usedJSHeapSize : 0,
          // @ts-ignore
          totalJSHeapSize: performance.memory ? performance.memory.totalJSHeapSize : 0,
        });
        this.#profileInProgress = null;
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
    writeSceneLog(this.constructor.name, 'Trying to complete profile', this.#profileInProgress);
    if (this.queryController.runningQueriesCount() === 0 && this.#profileInProgress) {
      writeSceneLog(this.constructor.name, 'All queries completed, stopping profile');
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
      writeSceneLog(this.constructor.name, 'Cancelled recording frames, new profile started');
    }
  }

  public addCrumb(crumb: string) {
    if (this.#profileInProgress) {
      writeSceneLog(this.constructor.name, 'Adding crumb:', crumb);
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

function captureNetwork(startTs: number, endTs: number) {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  performance.clearResourceTimings();
  const networkEntries = entries.filter((entry) => entry.startTime >= startTs && entry.startTime <= endTs);
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
export const TIME_RANGE_CHANGE_INTERACTION = 'time-range-change';
export const FILTER_ADDED_INTERACTION = 'filter-added';
export const FILTER_REMOVED_INTERACTION = 'filter-removed';
export const FILTER_CHANGED_INTERACTION = 'filter-changed';
export const FILTER_RESTORED_INTERACTION = 'filter-restored';
export const VARIABLE_VALUE_CHANGED_INTERACTION = 'variable-value-changed';
export const SCOPES_CHANGED_INTERACTION = 'scopes-changed';
